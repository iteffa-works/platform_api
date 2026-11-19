/**
 * Синхронізація копії даних панелей (раз на `jobIntervalMinutes` і одразу після змін через платформу).
 *
 * Сервер за прохід: списки всіх власників одним запросом на розділ (користувачі, сайти, DNS, пошта, БД, FTP, SSL),
 * cron — по привʼязаних акаунтах (панель віддає планувальник лише від імені власника), IP сервера.
 * У БД пишеться лише змінене: обʼєкти (hash), використання акаунтів, IP; стан сервера — один UPDATE.
 */
import { Op } from 'sequelize';
import { HostingAccount, HostingResource, HostingServer, type ResourceKindName } from '../domain/models.js';
import { ipsByFamily } from '../domain/input.js';
import type { PanelSection } from '../hooks.js';
import type { PanelAccount, PanelClient, ResourceKind } from '../providers/contracts.js';
import type { MirrorItem, MirrorService } from './mirror.service.js';
import { settle } from './panel-call.js';
import type { ServerService } from './server.service.js';

type Loader = { capability: ResourceKind; load: (client: PanelClient, owner?: string) => Promise<MirrorItem[]> };

/** Розділ копії → запит до панелі. Ключ cron — з власником: ключі планувальника унікальні лише в межах користувача */
const LOADERS: Record<ResourceKindName, Loader> = {
  user: { capability: 'accounts', load: async (client) => (await client.accounts.list()).map((item) => ({ key: item.login, owner: item.login, data: item })) },
  package: { capability: 'accounts', load: async (client) => (await client.accounts.packages()).map((item) => ({ key: item.name, owner: null, data: item })) },
  site: { capability: 'sites', load: async (client, owner) => (await client.sites.list(owner)).map((item) => ({ key: item.name, owner: item.owner || owner || null, data: item })) },
  zone: { capability: 'dns', load: async (client, owner) => (await client.dns.zones(owner)).map((item) => ({ key: item.name, owner: item.owner || owner || null, data: item })) },
  maildomain: { capability: 'mail', load: async (client, owner) => (await client.mail.domains(owner)).map((item) => ({ key: item.name, owner: item.owner || owner || null, data: item })) },
  mailbox: { capability: 'mail', load: async (client, owner) => (await client.mail.boxes(owner)).map((item) => ({ key: item.address, owner: item.owner || owner || null, data: item })) },
  database: { capability: 'databases', load: async (client, owner) => (await client.databases.list(owner)).map((item) => ({ key: item.key, owner: item.owner || owner || null, data: item })) },
  ftp: { capability: 'ftp', load: async (client, owner) => (await client.ftp.list(owner)).map((item) => ({ key: item.name, owner: item.owner || owner || null, data: item })) },
  ssl: { capability: 'ssl', load: async (client, owner) => (await client.ssl.list(owner)).map((item) => ({ key: item.key, owner: item.owner || owner || null, data: item })) },
  cron: { capability: 'cron', load: async (client, owner) => (await client.cron.list(owner)).map((item) => ({ key: `${owner}:${item.key}`, owner: owner ?? null, data: { ...item, owner } })) },
};

/** Розділ кабінету → розділи копії, які зачіпає зміна */
export const SECTION_KINDS: Record<PanelSection, ResourceKindName[]> = {
  accounts: ['user'],
  sites: ['site'],
  dns: ['zone'],
  mail: ['maildomain', 'mailbox'],
  databases: ['database'],
  ftp: ['ftp'],
  cron: ['cron'],
};

/** Розділи, що читаються одним запитом для всіх власників */
const BULK: ResourceKindName[] = ['user', 'package', 'site', 'zone', 'maildomain', 'mailbox', 'database', 'ftp', 'ssl'];
/** Розділи одного власника (оновлення після зміни / кнопка «Оновити») */
const OWNER_KINDS: ResourceKindName[] = ['site', 'zone', 'maildomain', 'mailbox', 'database', 'ftp', 'ssl', 'cron'];

export type SyncResult = { changes: number; errors: string[] };

export class SyncService {
  private running = false;

  constructor(private readonly servers: ServerService, private readonly mirror: MirrorService) {}

  private supports(server: HostingServer, kind: ResourceKindName): boolean {
    return this.servers.providers.get(server.provider).capabilities.includes(LOADERS[kind].capability);
  }

  /** Невидалені акаунти сервера (власники, для яких тримаємо cron і використання) */
  private linked(serverId: number): Promise<HostingAccount[]> {
    return HostingAccount.findAll({ where: { serverId, status: { [Op.in]: ['active', 'suspended'] } } });
  }

  /** Використання ресурсів акаунта: оновити рядок лише якщо змінилось */
  private async applyUsage(account: HostingAccount, usage: Partial<Pick<HostingAccount, 'diskUsedMb' | 'diskLimitMb' | 'sitesUsed' | 'sitesLimit'>>): Promise<boolean> {
    const patch = Object.fromEntries(Object.entries(usage).filter(([key, value]) => value !== undefined && value !== account[key as keyof HostingAccount]));
    if (!Object.keys(patch).length) return false;
    await account.update({ ...patch, usageAt: new Date() });
    return true;
  }

  /** Повна синхронізація сервера */
  async syncServer(server: HostingServer): Promise<SyncResult> {
    const result: SyncResult = { changes: 0, errors: [] };
    const fail = (label: string, error: string) => result.errors.push(`${label}: ${error}`.slice(0, 255));
    let client: PanelClient;
    try {
      client = this.servers.client(server);
    } catch (error) {
      fail('connect', error instanceof Error ? error.message : String(error));
      await server.update({ syncError: result.errors[0] });
      return result;
    }

    const bulk = BULK.filter((kind) => this.supports(server, kind));
    const [lists, ips] = await Promise.all([
      Promise.all(bulk.map((kind) => settle(() => LOADERS[kind].load(client)))),
      this.servers.providers.get(server.provider).capabilities.includes('system') ? settle(() => client.system.ips()) : null,
    ]);
    const loaded = new Map<ResourceKindName, MirrorItem[]>();
    for (const [index, kind] of bulk.entries()) {
      const list = lists[index]!;
      if (!list.ok) {
        fail(kind, list.error);
        continue;
      }
      loaded.set(kind, list.value);
      result.changes += await this.mirror.reconcile(server.id, kind, list.value);
    }

    const accounts = await this.linked(server.id);

    // Cron — по власниках; записи колишніх власників прибрати
    if (this.supports(server, 'cron')) {
      for (const account of accounts) {
        const jobs = await settle(() => LOADERS.cron.load(client, account.panelUser));
        if (jobs.ok) result.changes += await this.mirror.reconcile(server.id, 'cron', jobs.value, account.panelUser);
        else fail(`cron ${account.panelUser}`, jobs.error);
      }
      await HostingResource.destroy({ where: { serverId: server.id, kind: 'cron', owner: { [Op.notIn]: accounts.map((account) => account.panelUser).concat('') } } });
    }

    // Використання: диск — зі списку користувачів панелі, сайти — підрахунок копії
    const users = loaded.get('user');
    const sites = loaded.get('site');
    if (users || sites) {
      const byLogin = new Map((users ?? []).map((item) => [item.key, item.data as PanelAccount]));
      const siteCount = new Map<string, number>();
      for (const site of sites ?? []) if (site.owner) siteCount.set(site.owner, (siteCount.get(site.owner) ?? 0) + 1);
      for (const account of accounts) {
        const user = byLogin.get(account.panelUser);
        const changed = await this.applyUsage(account, {
          ...(user ? { diskUsedMb: user.diskUsedMb, diskLimitMb: user.diskLimitMb ?? account.diskLimitMb } : {}),
          ...(sites ? { sitesUsed: siteCount.get(account.panelUser) ?? 0 } : {}),
        });
        if (changed) result.changes += 1;
      }
    }

    // IP сервера з панелі (родина, якої панель не повернула, лишається як задано вручну)
    const patch: Partial<Pick<HostingServer, 'ipv4' | 'ipv6' | 'syncedAt' | 'syncError'>> = {};
    if (ips?.ok && ips.value.length) {
      const found = ipsByFamily(ips.value);
      if (found.ipv4 && found.ipv4 !== server.ipv4) patch.ipv4 = found.ipv4;
      if (found.ipv6 && found.ipv6 !== server.ipv6) patch.ipv6 = found.ipv6;
    } else if (ips && !ips.ok) {
      fail('ips', ips.error);
    }
    // Хоч один розділ прочитано — дані актуальні
    if (loaded.size || !bulk.length) patch.syncedAt = new Date();
    patch.syncError = result.errors[0] ?? null;
    await server.update(patch);
    return result;
  }

  /** Усі увімкнені сервери по черзі (фонове завдання) */
  async syncAll(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      for (const server of await HostingServer.findAll({ where: { isActive: true } })) {
        const { changes, errors } = await this.syncServer(server);
        if (errors.length) console.warn(`[hosting] sync ${server.name}: ${errors.join('; ')}`);
        else if (changes) console.info(`[hosting] sync ${server.name}: ${changes} змін`);
      }
    } finally {
      this.running = false;
    }
  }

  /** Лише шаблони панелей усіх увімкнених серверів (кнопка «Оновити шаблони» на сторінці тарифів) */
  async syncPackages(): Promise<{ changes: number; errors: string[] }> {
    const result = { changes: 0, errors: [] as string[] };
    for (const server of await HostingServer.findAll({ where: { isActive: true } })) {
      try {
        if (!this.supports(server, 'package')) continue;
        const items = await LOADERS.package.load(this.servers.client(server));
        result.changes += await this.mirror.reconcile(server.id, 'package', items);
      } catch (error) {
        result.errors.push(`${server.name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    return result;
  }

  /** Розділи одного власника — одразу після зміни через платформу (сервер уже під навантаженням дії) */
  async syncOwner(account: HostingAccount, kinds: ResourceKindName[] = OWNER_KINDS): Promise<void> {
    const server = account.server ?? await HostingServer.findByPk(account.serverId);
    if (!server) return;
    const client = this.servers.client(server);
    for (const kind of kinds.filter((item) => item !== 'user' && item !== 'package' && this.supports(server, item))) {
      const items = await LOADERS[kind].load(client, account.panelUser);
      await this.mirror.reconcile(server.id, kind, items, account.panelUser);
      if (kind === 'site') await this.applyUsage(account, { sitesUsed: items.length });
    }
  }

  /** Кнопка «Оновити дані»: використання з панелі + усі розділи власника */
  async syncAccount(account: HostingAccount): Promise<void> {
    const usage = await this.servers.client(account.server!).accounts.usage(account.panelUser);
    await this.applyUsage(account, usage);
    await this.syncOwner(account);
  }
}
