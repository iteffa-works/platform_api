/** Сервери панелей: облік, підключення, перевірка, огляд системи, користувачі панелі (з копії), діагностика */
import { Op } from 'sequelize';
import { decrypt, encrypt } from '../../../shared/crypto/index.js';
import { HttpError } from '../../../shared/http/index.js';
import { optionalCount, optionalText, readCountry, readIps, readText } from '../domain/input.js';
import { HostingAccount, HostingServer } from '../domain/models.js';
import { PanelError, type PanelAccount, type PanelClient } from '../providers/contracts.js';
import type { ProviderRegistry } from '../providers/registry.js';
import type { MirrorService } from './mirror.service.js';
import { PanelCache } from './panel-cache.js';
import { panelCall, settle } from './panel-call.js';
import { presentServer } from './presenter.js';

type ServerInput = Partial<Pick<HostingServer,
  'provider' | 'name' | 'url' | 'username' | 'verifyTls' | 'isActive' | 'isPublic' | 'defaultPreset' | 'location' | 'ipv4' | 'ipv6' | 'maxAccounts'
>> & { password?: string };

export class ServerService {
  /** Кеш читань панелей, яких немає в копії (записи DNS, огляд системи, шаблони); скидається після змін */
  readonly cache = new PanelCache();

  constructor(readonly providers: ProviderRegistry, private readonly mirror: MirrorService) {}

  async find(id: number): Promise<HostingServer> {
    const server = await HostingServer.findByPk(id);
    if (!server) throw new HttpError(404, 'Сервер не знайдено');
    return server;
  }

  /** Підключення до панелі сервера (пароль розшифровується лише тут) */
  client(server: HostingServer): PanelClient {
    return this.providers.get(server.provider).connect({
      url: server.url,
      username: server.username,
      password: decrypt(server.passwordEnc),
      verifyTls: server.verifyTls,
    });
  }

  private forget(server: HostingServer): void {
    this.providers.get(server.provider).forgetSession?.(server.url, server.username);
    this.cache.invalidate(server.id);
  }

  private read(input: Record<string, unknown>, partial: boolean, current?: HostingServer): ServerInput {
    const data: ServerInput = {};
    const has = (key: string) => !partial || input[key] !== undefined;
    const provider = this.providers.get(String(input.provider ?? current?.provider ?? 'ispmanager6'));
    if (has('provider')) data.provider = provider.id;
    if (has('name')) data.name = readText(input.name, 'Назва сервера', 80);
    if (has('url')) data.url = provider.normalizeUrl(input.url);
    if (has('username')) data.username = readText(input.username, 'Логін адміністратора панелі', 64);
    // При оновленні пароль — лише якщо передано непорожній
    if (!partial || (input.password !== undefined && input.password !== '')) data.password = readText(input.password, 'Пароль адміністратора панелі', 128);
    if (input.verifyTls !== undefined) data.verifyTls = Boolean(input.verifyTls);
    if (input.isActive !== undefined) data.isActive = Boolean(input.isActive);
    if (input.isPublic !== undefined) data.isPublic = Boolean(input.isPublic);
    if (input.defaultPreset !== undefined) data.defaultPreset = optionalText(input.defaultPreset, 64);
    if (input.location !== undefined) data.location = readCountry(input.location);
    if (input.ipv4 !== undefined) data.ipv4 = readIps(input.ipv4, 4);
    if (input.ipv6 !== undefined) data.ipv6 = readIps(input.ipv6, 6);
    if (input.maxAccounts !== undefined) data.maxAccounts = optionalCount(input.maxAccounts, 'Ліміт акаунтів', 1);
    return data;
  }

  /** Кількість невидалених акаунтів на серверах — одним GROUP BY */
  async accountCounts(): Promise<Map<number, number>> {
    const rows = await HostingAccount.count({ where: { status: { [Op.ne]: 'deleted' } }, group: ['serverId'] }) as unknown as Array<{ serverId: number; count: number }>;
    return new Map(rows.map((row) => [row.serverId, Number(row.count)]));
  }

  async list() {
    const [servers, counts] = await Promise.all([HostingServer.findAll({ order: [['name', 'ASC']] }), this.accountCounts()]);
    return {
      providers: this.providers.list(),
      servers: servers.map((server) => presentServer(server, counts.get(server.id) ?? 0)),
    };
  }

  async view(id: number) {
    const [server, counts] = await Promise.all([this.find(id), this.accountCounts()]);
    return presentServer(server, counts.get(id) ?? 0);
  }

  async create(input: Record<string, unknown>) {
    const { password, ...data } = this.read(input, false);
    const server = await HostingServer.create({
      ...(data as Required<Pick<ServerInput, 'name' | 'url' | 'username'>> & ServerInput),
      passwordEnc: encrypt(password!),
    });
    return { server: presentServer(server) };
  }

  async update(id: number, input: Record<string, unknown>) {
    const server = await this.find(id);
    const { password, ...data } = this.read(input, true, server);
    this.forget(server);
    await server.update({ ...data, ...(password ? { passwordEnc: encrypt(password) } : {}) });
    return { server: await this.view(id) };
  }

  async remove(id: number) {
    const server = await this.find(id);
    if (await HostingAccount.count({ where: { serverId: id } })) {
      throw new HttpError(400, 'На сервері є акаунти (зокрема в історії) — вимкніть сервер замість видалення');
    }
    this.forget(server);
    await server.destroy();
  }

  /** Перевірка зʼєднання: помилку панелі повертає як результат, а не 502 */
  async check(id: number) {
    const server = await this.find(id);
    try {
      return { ok: true as const, ...(await this.client(server).check()) };
    } catch (error) {
      if (error instanceof PanelError) return { ok: false as const, error: error.message };
      throw error;
    }
  }

  /** Система панелі (версія, ліцензія, служби, PHP) — живий запит через кеш; частини незалежні */
  async overview(id: number) {
    const server = await this.find(id);
    const client = this.client(server);
    return this.cache.get(id, 'overview', async () => {
      const [info, services, php] = await Promise.all([
        settle(() => client.system.info()),
        settle(() => client.system.services()),
        settle(() => client.system.php()),
      ]);
      return { info, services, php };
    });
  }

  async packages(id: number) {
    const server = await this.find(id);
    const packages = await panelCall(() => this.cache.get(id, 'packages', () => this.client(server).accounts.packages()));
    return { packages: packages.map((item) => item.name) };
  }

  /** Користувачі панелі (з копії) + привʼязка до акаунтів платформи */
  async panelAccounts(id: number) {
    const [accounts, linked] = await Promise.all([
      this.mirror.list<PanelAccount>(id, 'user'),
      HostingAccount.findAll({ where: { serverId: id, status: { [Op.ne]: 'deleted' } }, attributes: ['id', 'panelUser'] }),
    ]);
    const byLogin = new Map(linked.map((account) => [account.panelUser, account.id]));
    return { accounts: accounts.map((account) => ({ ...account, accountId: byLogin.get(account.login) ?? null })) };
  }

  /** Вхід у панель від імені користувача (підтримка) */
  async loginUrl(id: number, login: string) {
    const server = await this.find(id);
    return { url: await panelCall(() => this.client(server).accounts.loginUrl(login)) };
  }

  async diagnostics(id: number, login?: string) {
    const server = await this.find(id);
    return { provider: server.provider, diagnostics: await panelCall(() => this.client(server).diagnostics(login || undefined)) };
  }

  /** Публічні сервери з вільним місцем, від найменш завантаженого */
  async available(): Promise<HostingServer[]> {
    const [servers, counts] = await Promise.all([HostingServer.findAll({ where: { isActive: true, isPublic: true } }), this.accountCounts()]);
    return servers
      .filter((server) => server.maxAccounts === null || (counts.get(server.id) ?? 0) < server.maxAccounts)
      .sort((left, right) => (counts.get(left.id) ?? 0) - (counts.get(right.id) ?? 0));
  }
}
