/**
 * Консоль панелі (адмінка): усі розділи панелі сервера — користувачі, сайти, DNS, пошта, БД, FTP, SSL, cron, система.
 * Кожна зміна: перевірка вводу → виклик провайдера (panelCall) → хук `hosting.panel.changed` (журнал).
 * `owner` — дія від імені користувача панелі; без нього — бачення адміністратора (усі обʼєкти).
 */
import type { Request } from 'express';
import { hooks } from '../../../core/hooks/index.js';
import { HttpError } from '../../../shared/http/index.js';
import { generatePassword, readCommand, readDnsType, readDomain, readLogin, readName, readPassword, readSchedule } from '../domain/rules.js';
import type { PanelSection } from '../hooks.js';
import type { PanelClient } from '../providers/contracts.js';
import { panelCall } from './panel-call.js';
import type { ServerService } from './server.service.js';

export type Actor = { req: Request; actorId: number };

function readOwner(input: unknown): string {
  const owner = String(input ?? '').trim();
  if (!owner || owner.length > 64 || /[\s/\\]/.test(owner)) throw new HttpError(400, 'Оберіть власника (користувача панелі)');
  return owner;
}

/** Необовʼязковий пароль: порожньо — згенерувати (повертається один раз) */
function passwordOrGenerated(input: unknown): { password: string; generated: string | null } {
  if (input === undefined || input === null || input === '') {
    const password = generatePassword();
    return { password, generated: password };
  }
  return { password: readPassword(input), generated: null };
}

export class PanelService {
  constructor(private readonly servers: ServerService) {}

  private async client(serverId: number): Promise<PanelClient> {
    const { server, client } = await this.servers.clientById(serverId);
    if (!server.isActive) throw new HttpError(400, 'Сервер вимкнено — увімкніть його, щоб керувати панеллю');
    return client;
  }

  /** Читання з панелі */
  private async read<T>(serverId: number, fn: (client: PanelClient) => Promise<T>): Promise<T> {
    const client = await this.client(serverId);
    return panelCall(() => fn(client));
  }

  /** Зміна в панелі + запис у журнал через хук */
  private async change<T>(
    actor: Actor,
    serverId: number,
    section: PanelSection,
    action: 'create' | 'delete' | 'update',
    name: string,
    fn: (client: PanelClient) => Promise<T>,
  ): Promise<T> {
    const client = await this.client(serverId);
    const result = await panelCall(() => fn(client));
    await hooks.doAction('hosting.panel.changed', { ...actor, serverId, section, action, name });
    return result;
  }

  /* ---------- Огляд ---------- */

  /** Система панелі; кожна частина незалежна — збій однієї не ховає інші */
  async overview(serverId: number) {
    const client = await this.client(serverId);
    const settle = async <T>(fn: () => Promise<T>) => {
      try {
        return { ok: true as const, value: await fn() };
      } catch (error) {
        return { ok: false as const, error: error instanceof Error ? error.message : String(error) };
      }
    };
    const [info, services, ips, php] = await Promise.all([
      settle(() => client.system.info()),
      settle(() => client.system.services()),
      settle(() => client.system.ips()),
      settle(() => client.system.php()),
    ]);
    return { info, services, ips, php };
  }

  /* ---------- Користувачі панелі ---------- */

  async createPanelUser(actor: Actor, serverId: number, input: Record<string, unknown>) {
    const login = readLogin(input.login);
    const { password, generated } = passwordOrGenerated(input.password);
    const pkg = String(input.package ?? '').trim() || null;
    await this.change(actor, serverId, 'accounts', 'create', login, (client) =>
      client.accounts.create({ login, password, package: pkg, name: String(input.name ?? '').trim().slice(0, 80) || login }));
    return { login, password: generated };
  }

  async setPanelUserState(actor: Actor, serverId: number, login: string, action: 'suspend' | 'resume') {
    await this.change(actor, serverId, 'accounts', 'update', `${action} ${login}`, (client) =>
      action === 'suspend' ? client.accounts.suspend(login) : client.accounts.resume(login));
  }

  async setPanelUserPassword(actor: Actor, serverId: number, login: string, input: unknown) {
    const { password, generated } = passwordOrGenerated(input);
    await this.change(actor, serverId, 'accounts', 'update', `password ${login}`, (client) => client.accounts.setPassword(login, password));
    return { password: generated };
  }

  async removePanelUser(actor: Actor, serverId: number, login: string) {
    await this.change(actor, serverId, 'accounts', 'delete', login, (client) => client.accounts.remove(login));
  }

  async panelLoginUrl(actor: Actor, serverId: number, login: string) {
    const url = await this.change(actor, serverId, 'accounts', 'update', `login-as ${login}`, (client) => client.accounts.loginUrl(login));
    return { url };
  }

  /* ---------- Сайти ---------- */

  sites(serverId: number, owner?: string) {
    return this.read(serverId, (client) => client.sites.list(owner));
  }

  async createSite(actor: Actor, serverId: number, input: Record<string, unknown>) {
    const owner = readOwner(input.owner);
    const name = readDomain(input.name);
    await this.change(actor, serverId, 'sites', 'create', name, (client) => client.sites.create({ owner, name }));
  }

  async removeSite(actor: Actor, serverId: number, name: string, owner?: string) {
    await this.change(actor, serverId, 'sites', 'delete', name, (client) => client.sites.remove(name, owner));
  }

  /* ---------- DNS ---------- */

  zones(serverId: number, owner?: string) {
    return this.read(serverId, (client) => client.dns.zones(owner));
  }

  records(serverId: number, zone: string) {
    return this.read(serverId, (client) => client.dns.records(readDomain(zone)));
  }

  async createZone(actor: Actor, serverId: number, input: Record<string, unknown>) {
    const owner = readOwner(input.owner);
    const name = readDomain(input.name);
    const ip = String(input.ip ?? '').trim();
    await this.change(actor, serverId, 'dns', 'create', name, async (client) => {
      const address = ip || (await client.system.ips())[0];
      if (!address) throw new HttpError(400, 'Вкажіть IP-адресу для зони');
      await client.dns.createZone({ owner, name, ip: address });
    });
  }

  async removeZone(actor: Actor, serverId: number, name: string, owner?: string) {
    await this.change(actor, serverId, 'dns', 'delete', name, (client) => client.dns.removeZone(name, owner));
  }

  async addRecord(actor: Actor, serverId: number, zoneInput: string, input: Record<string, unknown>) {
    const zone = readDomain(zoneInput);
    const type = readDnsType(input.type);
    const name = String(input.name ?? '').trim();
    const value = String(input.value ?? '').trim();
    if (!name || name.length > 255 || /\s/.test(name)) throw new HttpError(400, 'Імʼя запису: без пробілів, напр. www або @');
    if (!value || value.length > 2000) throw new HttpError(400, 'Значення запису обовʼязкове');
    const ttl = input.ttl ? Math.trunc(Number(input.ttl)) : undefined;
    if (ttl !== undefined && (!Number.isFinite(ttl) || ttl < 60 || ttl > 604800)) throw new HttpError(400, 'TTL: 60–604800 с');
    const priority = input.priority !== undefined && input.priority !== '' ? Math.trunc(Number(input.priority)) : undefined;
    const fqdn = name === '@' ? `${zone}.` : name;
    await this.change(actor, serverId, 'dns', 'create', `${type} ${name}.${zone}`, (client) =>
      client.dns.addRecord(zone, { name: fqdn, type, value, ttl, priority }));
  }

  async removeRecord(actor: Actor, serverId: number, zone: string, key: string) {
    await this.change(actor, serverId, 'dns', 'delete', `${zone}: ${key}`, (client) => client.dns.removeRecord(readDomain(zone), key));
  }

  /* ---------- Пошта ---------- */

  mailDomains(serverId: number, owner?: string) {
    return this.read(serverId, (client) => client.mail.domains(owner));
  }

  mailboxes(serverId: number, owner?: string) {
    return this.read(serverId, (client) => client.mail.boxes(owner));
  }

  async createMailDomain(actor: Actor, serverId: number, input: Record<string, unknown>) {
    const owner = readOwner(input.owner);
    const name = readDomain(input.name);
    await this.change(actor, serverId, 'mail', 'create', name, (client) => client.mail.createDomain({ owner, name }));
  }

  async removeMailDomain(actor: Actor, serverId: number, name: string, owner?: string) {
    await this.change(actor, serverId, 'mail', 'delete', name, (client) => client.mail.removeDomain(name, owner));
  }

  async createMailbox(actor: Actor, serverId: number, input: Record<string, unknown>) {
    const owner = readOwner(input.owner);
    const domain = readDomain(input.domain);
    const name = readName(input.name, 'Скринька', 64);
    const { password, generated } = passwordOrGenerated(input.password);
    const quotaMb = input.quotaMb ? Math.max(0, Math.trunc(Number(input.quotaMb))) : undefined;
    const address = `${name}@${domain}`;
    await this.change(actor, serverId, 'mail', 'create', address, (client) => client.mail.createBox({ owner, name, domain, password, quotaMb }));
    return { address, password: generated };
  }

  async removeMailbox(actor: Actor, serverId: number, address: string, owner?: string) {
    await this.change(actor, serverId, 'mail', 'delete', address, (client) => client.mail.removeBox(address, owner));
  }

  async setMailboxPassword(actor: Actor, serverId: number, address: string, input: unknown, owner?: string) {
    const { password, generated } = passwordOrGenerated(input);
    await this.change(actor, serverId, 'mail', 'update', `password ${address}`, (client) => client.mail.setBoxPassword(address, password, owner));
    return { password: generated };
  }

  /* ---------- Бази даних ---------- */

  databases(serverId: number, owner?: string) {
    return this.read(serverId, (client) => client.databases.list(owner));
  }

  async createDatabase(actor: Actor, serverId: number, input: Record<string, unknown>) {
    const owner = readOwner(input.owner);
    const name = readName(input.name, 'Імʼя бази', 64);
    const user = readName(input.user || name, 'Користувач БД', 32);
    const { password, generated } = passwordOrGenerated(input.password);
    await this.change(actor, serverId, 'databases', 'create', name, (client) => client.databases.create({ owner, name, user, password }));
    return { name, user, password: generated };
  }

  async removeDatabase(actor: Actor, serverId: number, key: string, owner?: string) {
    await this.change(actor, serverId, 'databases', 'delete', key, (client) => client.databases.remove(key, owner));
  }

  /* ---------- FTP ---------- */

  ftp(serverId: number, owner?: string) {
    return this.read(serverId, (client) => client.ftp.list(owner));
  }

  async createFtp(actor: Actor, serverId: number, input: Record<string, unknown>) {
    const owner = readOwner(input.owner);
    const name = readName(input.name, 'FTP-користувач', 32);
    const home = String(input.home ?? '').trim() || '/';
    if (home.includes('..') || home.length > 255) throw new HttpError(400, 'Домашній каталог: відносний шлях без «..»');
    const { password, generated } = passwordOrGenerated(input.password);
    await this.change(actor, serverId, 'ftp', 'create', name, (client) => client.ftp.create({ owner, name, password, home }));
    return { name, password: generated };
  }

  async removeFtp(actor: Actor, serverId: number, name: string, owner?: string) {
    await this.change(actor, serverId, 'ftp', 'delete', name, (client) => client.ftp.remove(name, owner));
  }

  /* ---------- SSL і cron ---------- */

  certificates(serverId: number, owner?: string) {
    return this.read(serverId, (client) => client.ssl.list(owner));
  }

  cron(serverId: number, owner?: string) {
    return this.read(serverId, (client) => client.cron.list(owner));
  }

  async createCron(actor: Actor, serverId: number, input: Record<string, unknown>) {
    const owner = readOwner(input.owner);
    const command = readCommand(input.command);
    const schedule = readSchedule(input.schedule);
    const description = String(input.description ?? '').trim().slice(0, 255) || undefined;
    await this.change(actor, serverId, 'cron', 'create', command.slice(0, 80), (client) => client.cron.create({ owner, command, schedule, description }));
  }

  async removeCron(actor: Actor, serverId: number, key: string, owner?: string) {
    await this.change(actor, serverId, 'cron', 'delete', key.slice(0, 80), (client) => client.cron.remove(key, owner));
  }
}
