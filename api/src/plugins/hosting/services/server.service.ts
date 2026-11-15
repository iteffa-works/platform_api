/** Сервери панелей: облік, підключення, перевірка, шаблони, діагностика */
import { isIP } from 'node:net';
import { Op } from 'sequelize';
import { decrypt, encrypt } from '../../../shared/crypto/index.js';
import { HttpError } from '../../../shared/http/index.js';
import { HostingAccount, HostingServer } from '../domain/models.js';
import { PanelError, type PanelClient } from '../providers/contracts.js';
import type { ProviderRegistry } from '../providers/registry.js';
import { PanelCache } from './panel-cache.js';
import { panelCall } from './panel-call.js';
import { presentServer } from './presenter.js';

type ServerInput = Partial<Pick<HostingServer,
  'provider' | 'name' | 'url' | 'username' | 'verifyTls' | 'isActive' | 'isPublic' | 'defaultPreset' | 'location' | 'ipv4' | 'ipv6' | 'maxAccounts'
>> & { password?: string };

function readIps(input: unknown, family: 4 | 6): string | null {
  const list = String(input ?? '').split(/[\s,]+/).filter(Boolean);
  for (const ip of list) {
    if (isIP(ip) !== family) throw new HttpError(400, `Некоректна IPv${family}-адреса: ${ip.slice(0, 45)}`);
  }
  return list.length ? list.slice(0, 8).join(', ') : null;
}

export class ServerService {
  /** Кеш читань панелей — спільний для сервісів (скидається після змін) */
  constructor(readonly providers: ProviderRegistry, readonly cache = new PanelCache()) {}

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

  async clientById(id: number): Promise<{ server: HostingServer; client: PanelClient }> {
    const server = await this.find(id);
    return { server, client: this.client(server) };
  }

  private forget(server: HostingServer): void {
    this.providers.get(server.provider).forgetSession?.(server.url, server.username);
    this.cache.invalidate(server.id);
  }

  private read(input: Record<string, unknown>, partial: boolean, current?: HostingServer): ServerInput {
    const data: ServerInput = {};
    const providerId = String(input.provider ?? current?.provider ?? 'ispmanager6');
    const provider = this.providers.get(providerId);
    if (!partial || input.provider !== undefined) data.provider = provider.id;
    if (!partial || input.name !== undefined) {
      const name = String(input.name ?? '').trim();
      if (!name || name.length > 80) throw new HttpError(400, 'Назва сервера: 1–80 символів');
      data.name = name;
    }
    if (!partial || input.url !== undefined) data.url = provider.normalizeUrl(input.url);
    if (!partial || input.username !== undefined) {
      const username = String(input.username ?? '').trim();
      if (!username || username.length > 64) throw new HttpError(400, 'Логін адміністратора панелі: 1–64 символи');
      data.username = username;
    }
    // При оновленні пароль — лише якщо передано непорожній
    if (!partial || (input.password !== undefined && input.password !== '')) {
      const password = String(input.password ?? '');
      if (!password || password.length > 128) throw new HttpError(400, 'Пароль адміністратора панелі: 1–128 символів');
      data.password = password;
    }
    if (input.verifyTls !== undefined) data.verifyTls = Boolean(input.verifyTls);
    if (input.isActive !== undefined) data.isActive = Boolean(input.isActive);
    if (input.isPublic !== undefined) data.isPublic = Boolean(input.isPublic);
    if (input.defaultPreset !== undefined) data.defaultPreset = String(input.defaultPreset ?? '').trim().slice(0, 64) || null;
    if (input.location !== undefined) {
      const location = String(input.location ?? '').trim().toUpperCase();
      if (location && !/^[A-Z]{2}$/.test(location)) throw new HttpError(400, 'Країна: код ISO з 2 літер (UA, DE, …)');
      data.location = location || null;
    }
    if (input.ipv4 !== undefined) data.ipv4 = readIps(input.ipv4, 4);
    if (input.ipv6 !== undefined) data.ipv6 = readIps(input.ipv6, 6);
    if (input.maxAccounts !== undefined) {
      const max = input.maxAccounts === null || input.maxAccounts === '' ? null : Math.trunc(Number(input.maxAccounts));
      if (max !== null && (!Number.isFinite(max) || max < 1)) throw new HttpError(400, 'Ліміт акаунтів: ціле число ≥ 1 або порожньо');
      data.maxAccounts = max;
    }
    return data;
  }

  /** Кількість невидалених акаунтів на серверах */
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
    return presentServer(await this.find(id), (await this.accountCounts()).get(id) ?? 0);
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

  async packages(id: number) {
    const { client } = await this.clientById(id);
    return { packages: await panelCall(() => this.cache.get(id, 'packages', () => client.accounts.packages())) };
  }

  /** Користувачі панелі + чи привʼязані до платформи */
  async panelAccounts(id: number) {
    const { client } = await this.clientById(id);
    const [accounts, linked] = await Promise.all([
      panelCall(() => this.cache.get(id, 'accounts', () => client.accounts.list())),
      HostingAccount.findAll({ where: { serverId: id, status: { [Op.ne]: 'deleted' } }, attributes: ['id', 'panelUser'] }),
    ]);
    const byLogin = new Map(linked.map((account) => [account.panelUser, account.id]));
    return { accounts: accounts.map((account) => ({ ...account, linked: byLogin.has(account.login), accountId: byLogin.get(account.login) ?? null })) };
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
