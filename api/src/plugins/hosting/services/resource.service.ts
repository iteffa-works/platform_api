/**
 * Ресурси хостинг-акаунта в кабінеті: сайти, DNS, пошта, БД, FTP, SSL, cron.
 * Читання — з копії в БД (MirrorService), без запиту до панелі; записи DNS-зони — з панелі через кеш.
 * Зміна: перевірка вводу → панель від імені власника → оновлення копії власника → хук `hosting.panel.changed`.
 */
import type { Request } from 'express';
import { hooks } from '../../../flowaxy/hooks/index.js';
import { HttpError } from '../../../shared/http/index.js';
import type { HostingAccount, ResourceKindName } from '../domain/models.js';
import { generatePassword, readCommand, readDnsType, readDomain, readName, readPassword, readSchedule } from '../domain/rules.js';
import type { PanelSection } from '../hooks.js';
import type { Certificate, CronJob, Database, DnsZone, FtpUser, Mailbox, MailDomain, PanelClient, PanelSite } from '../providers/contracts.js';
import type { MirrorService } from './mirror.service.js';
import { panelCall } from './panel-call.js';
import type { ServerService } from './server.service.js';
import { SECTION_KINDS, type SyncService } from './sync.service.js';

/** Хто діє (журнал): власник акаунта */
export type Actor = { req: Request; actorId: number };

/** Необовʼязковий пароль: порожньо — згенерувати (повертається один раз) */
function passwordOrGenerated(input: unknown): { password: string; generated: string | null } {
  if (input === undefined || input === null || input === '') {
    const password = generatePassword();
    return { password, generated: password };
  }
  return { password: readPassword(input), generated: null };
}

/** Тип обʼєкта копії за розділом */
type Mirrored = {
  site: PanelSite;
  zone: DnsZone;
  maildomain: MailDomain;
  mailbox: Mailbox;
  database: Database;
  ftp: FtpUser;
  ssl: Certificate;
  cron: CronJob;
};

export class ResourceService {
  constructor(
    private readonly servers: ServerService,
    private readonly mirror: MirrorService,
    private readonly sync: SyncService,
  ) {}

  /** Обʼєкти розділу власника з копії */
  list<K extends keyof Mirrored>(account: HostingAccount, kind: K): Promise<Mirrored[K][]> {
    return this.mirror.list<Mirrored[K]>(account.serverId, kind, account.panelUser);
  }

  /** Кількість обʼєктів власника за розділами (картки огляду) */
  counts(account: HostingAccount) {
    return this.mirror.counts(account.serverId, account.panelUser);
  }

  /** Обʼєкт належить власнику (за копією) — інакше 404 без розкриття чужих імен */
  private async ensureOwned(account: HostingAccount, kind: ResourceKindName, key: string, notFound: string): Promise<void> {
    if (!(await this.mirror.owns(account.serverId, kind, key, account.panelUser))) throw new HttpError(404, notFound);
  }

  /**
   * Зміна в панелі від імені власника: кеш читань сервера скидається, копія розділу власника оновлюється
   * (збій оновлення копії не скасовує зміну — наступна синхронізація підхопить), подія — в журнал.
   */
  private async change<T>(actor: Actor, account: HostingAccount, section: PanelSection, action: 'create' | 'delete' | 'update', name: string, fn: (client: PanelClient, owner: string) => Promise<T>): Promise<T> {
    const client = this.servers.client(account.server!);
    const result = await panelCall(() => fn(client, account.panelUser)).finally(() => this.servers.cache.invalidate(account.serverId));
    await this.sync.syncOwner(account, SECTION_KINDS[section]).catch((error) => console.warn(`[hosting] mirror ${account.panelUser}: ${error instanceof Error ? error.message : error}`));
    await hooks.doAction('hosting.panel.changed', { ...actor, serverId: account.serverId, section, action, name, client: true });
    return result;
  }

  /* ---------- Сайти ---------- */

  async createSite(actor: Actor, account: HostingAccount, input: Record<string, unknown>) {
    const name = readDomain(input.name);
    await this.change(actor, account, 'sites', 'create', name, (client, owner) => client.sites.create({ owner, name }));
  }

  async removeSite(actor: Actor, account: HostingAccount, name: string) {
    await this.ensureOwned(account, 'site', name, 'Сайт не знайдено');
    await this.change(actor, account, 'sites', 'delete', name, (client, owner) => client.sites.remove(name, owner));
  }

  /* ---------- DNS ---------- */

  /** Записи зони (не копіюються: читаються з панелі через кеш, лише для своєї зони) */
  async records(account: HostingAccount, zoneInput: string) {
    const zone = readDomain(zoneInput);
    await this.ensureOwned(account, 'zone', zone, 'DNS-зону не знайдено');
    const client = this.servers.client(account.server!);
    return panelCall(() => this.servers.cache.get(account.serverId, `records|${zone}`, () => client.dns.records(zone)));
  }

  async createZone(actor: Actor, account: HostingAccount, input: Record<string, unknown>) {
    const name = readDomain(input.name);
    await this.change(actor, account, 'dns', 'create', name, async (client, owner) => {
      // IP зони — перша адреса сервера (з копії налаштувань, синхронізованої з панеллю)
      const address = account.server!.ipv4?.split(/[\s,]+/)[0] || (await client.system.ips())[0];
      if (!address) throw new HttpError(400, 'Немає IP-адреси сервера для зони — зверніться до підтримки');
      await client.dns.createZone({ owner, name, ip: address });
    });
  }

  async removeZone(actor: Actor, account: HostingAccount, name: string) {
    await this.ensureOwned(account, 'zone', name, 'DNS-зону не знайдено');
    await this.change(actor, account, 'dns', 'delete', name, (client, owner) => client.dns.removeZone(name, owner));
  }

  async addRecord(actor: Actor, account: HostingAccount, zoneInput: string, input: Record<string, unknown>) {
    const zone = readDomain(zoneInput);
    const type = readDnsType(input.type);
    const name = String(input.name ?? '').trim();
    const value = String(input.value ?? '').trim();
    if (!name || name.length > 255 || /\s/.test(name)) throw new HttpError(400, 'Імʼя запису: без пробілів, напр. www або @');
    if (!value || value.length > 2000) throw new HttpError(400, 'Значення запису обовʼязкове');
    const ttl = input.ttl ? Math.trunc(Number(input.ttl)) : undefined;
    if (ttl !== undefined && (!Number.isFinite(ttl) || ttl < 60 || ttl > 604800)) throw new HttpError(400, 'TTL: 60–604800 с');
    const priority = input.priority !== undefined && input.priority !== '' ? Math.trunc(Number(input.priority)) : undefined;
    await this.ensureOwned(account, 'zone', zone, 'DNS-зону не знайдено');
    await this.change(actor, account, 'dns', 'create', `${type} ${name}.${zone}`, (client) =>
      client.dns.addRecord(zone, { name: name === '@' ? `${zone}.` : name, type, value, ttl, priority }));
  }

  async removeRecord(actor: Actor, account: HostingAccount, zoneInput: string, key: string) {
    const zone = readDomain(zoneInput);
    await this.ensureOwned(account, 'zone', zone, 'DNS-зону не знайдено');
    await this.change(actor, account, 'dns', 'delete', `${zone}: ${key}`, (client) => client.dns.removeRecord(zone, key));
  }

  /* ---------- Пошта ---------- */

  async createMailDomain(actor: Actor, account: HostingAccount, input: Record<string, unknown>) {
    const name = readDomain(input.name);
    await this.change(actor, account, 'mail', 'create', name, (client, owner) => client.mail.createDomain({ owner, name }));
  }

  async removeMailDomain(actor: Actor, account: HostingAccount, name: string) {
    await this.ensureOwned(account, 'maildomain', name, 'Поштовий домен не знайдено');
    await this.change(actor, account, 'mail', 'delete', name, (client, owner) => client.mail.removeDomain(name, owner));
  }

  async createMailbox(actor: Actor, account: HostingAccount, input: Record<string, unknown>) {
    const domain = readDomain(input.domain);
    const name = readName(input.name, 'Скринька', 64);
    const { password, generated } = passwordOrGenerated(input.password);
    const quotaMb = input.quotaMb ? Math.max(0, Math.trunc(Number(input.quotaMb))) : undefined;
    const address = `${name}@${domain}`;
    await this.ensureOwned(account, 'maildomain', domain, 'Поштовий домен не знайдено');
    await this.change(actor, account, 'mail', 'create', address, (client, owner) => client.mail.createBox({ owner, name, domain, password, quotaMb }));
    return { address, password: generated };
  }

  async removeMailbox(actor: Actor, account: HostingAccount, address: string) {
    await this.ensureOwned(account, 'mailbox', address, 'Скриньку не знайдено');
    await this.change(actor, account, 'mail', 'delete', address, (client, owner) => client.mail.removeBox(address, owner));
  }

  async setMailboxPassword(actor: Actor, account: HostingAccount, address: string, input: unknown) {
    const { password, generated } = passwordOrGenerated(input);
    await this.ensureOwned(account, 'mailbox', address, 'Скриньку не знайдено');
    await this.change(actor, account, 'mail', 'update', `password ${address}`, (client, owner) => client.mail.setBoxPassword(address, password, owner));
    return { password: generated };
  }

  /* ---------- Бази даних ---------- */

  async createDatabase(actor: Actor, account: HostingAccount, input: Record<string, unknown>) {
    const name = readName(input.name, 'Імʼя бази', 64);
    const user = readName(input.user || name, 'Користувач БД', 32);
    const { password, generated } = passwordOrGenerated(input.password);
    await this.change(actor, account, 'databases', 'create', name, (client, owner) => client.databases.create({ owner, name, user, password }));
    return { name, user, password: generated };
  }

  async removeDatabase(actor: Actor, account: HostingAccount, key: string) {
    await this.ensureOwned(account, 'database', key, 'Базу даних не знайдено');
    await this.change(actor, account, 'databases', 'delete', key, (client, owner) => client.databases.remove(key, owner));
  }

  /* ---------- FTP ---------- */

  async createFtp(actor: Actor, account: HostingAccount, input: Record<string, unknown>) {
    const name = readName(input.name, 'FTP-користувач', 32);
    const home = String(input.home ?? '').trim() || '/';
    if (home.includes('..') || home.length > 255) throw new HttpError(400, 'Домашній каталог: відносний шлях без «..»');
    const { password, generated } = passwordOrGenerated(input.password);
    await this.change(actor, account, 'ftp', 'create', name, (client, owner) => client.ftp.create({ owner, name, password, home }));
    return { name, password: generated };
  }

  async removeFtp(actor: Actor, account: HostingAccount, name: string) {
    await this.ensureOwned(account, 'ftp', name, 'FTP-користувача не знайдено');
    await this.change(actor, account, 'ftp', 'delete', name, (client, owner) => client.ftp.remove(name, owner));
  }

  /* ---------- Cron ---------- */

  async createCron(actor: Actor, account: HostingAccount, input: Record<string, unknown>) {
    const command = readCommand(input.command);
    const schedule = readSchedule(input.schedule);
    const description = String(input.description ?? '').trim().slice(0, 255) || undefined;
    await this.change(actor, account, 'cron', 'create', command.slice(0, 80), (client, owner) => client.cron.create({ owner, command, schedule, description }));
  }

  async removeCron(actor: Actor, account: HostingAccount, key: string) {
    await this.ensureOwned(account, 'cron', `${account.panelUser}:${key}`, 'Завдання не знайдено');
    await this.change(actor, account, 'cron', 'delete', key.slice(0, 80), (client, owner) => client.cron.remove(key, owner));
  }
}
