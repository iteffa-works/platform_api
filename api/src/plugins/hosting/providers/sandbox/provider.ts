/**
 * Технічна панель «Sandbox» — для розробки інтерфейсу й тестів без реального сервера.
 * Повний контракт PanelClient; стан у памʼяті + JSON. Симуляція збоїв:
 * - пароль адміністратора `wrong` → помилка входу;
 * - імʼя / логін, що містить `fail`, → помилка створення;
 * - затримка відповіді 30–120 мс.
 */
import { HttpError } from '../../../../shared/http/index.js';
import {
  PanelError, RESOURCES,
  type AccountsApi, type CronApi, type DatabasesApi, type DnsApi, type FtpApi, type HostingProvider, type MailApi,
  type PanelClient, type PanelConnection, type SitesApi, type SslApi, type SystemApi,
} from '../contracts.js';
import { SandboxStore } from './store.js';

const delay = () => new Promise((resolve) => setTimeout(resolve, 30 + Math.random() * 90));

abstract class SandboxSection {
  constructor(protected readonly store: SandboxStore, private readonly connection: PanelConnection) {}

  protected get state() {
    return this.store.state;
  }

  /** Затримка й «вхід»: пароль `wrong` — помилка автентифікації, як у реальної панелі */
  protected async gate(): Promise<void> {
    await delay();
    if (this.connection.password === 'wrong') throw new PanelError('Invalid username or password', 'auth');
  }

  /** Перевірка «збою» за іменем + зміна + збереження */
  protected async mutate(name: string, change: () => void): Promise<void> {
    await this.gate();
    if (name.includes('fail')) throw new PanelError(`Sandbox: симульована помилка для «${name}»`, 'value');
    change();
    this.store.save();
  }

  protected async read<T>(value: () => T): Promise<T> {
    await this.gate();
    return structuredClone(value());
  }

  protected requireOwner(owner: string): void {
    if (!this.state.accounts.some((account) => account.login === owner)) throw new PanelError(`Користувача ${owner} не існує`, 'missed');
  }

  protected unique(exists: boolean, name: string): void {
    if (exists) throw new PanelError(`«${name}» вже існує`, 'exists');
  }

  protected owned<T extends { owner: string | null }>(items: T[], owner?: string): T[] {
    return owner ? items.filter((item) => item.owner === owner) : items;
  }
}

class Accounts extends SandboxSection implements AccountsApi {
  list() {
    return this.read(() => this.state.accounts.map((account) => {
      const pkg = this.state.packages.find((item) => item.name === account.package);
      return {
        login: account.login, name: account.name, package: account.package, suspended: account.suspended,
        diskUsedMb: account.diskUsedMb, diskLimitMb: pkg?.diskMb ?? null, trafficUsedMb: Math.round(account.diskUsedMb * 3.7),
      };
    }));
  }

  packages() {
    return this.read(() => this.state.packages.map((item) => item.name));
  }

  create(input: Parameters<AccountsApi['create']>[0]) {
    return this.mutate(input.login, () => {
      this.unique(this.state.accounts.some((account) => account.login === input.login), input.login);
      this.state.accounts.push({ login: input.login, name: input.name, package: input.package, suspended: false, password: input.password, diskUsedMb: 0 });
    });
  }

  private account(login: string) {
    const account = this.state.accounts.find((item) => item.login === login);
    if (!account) throw new PanelError(`Користувача ${login} не існує`, 'missed');
    return account;
  }

  setPackage(login: string, pkg: string) {
    return this.mutate(login, () => void (this.account(login).package = pkg));
  }

  setPassword(login: string, password: string) {
    return this.mutate(login, () => void (this.account(login).password = password));
  }

  suspend(login: string) {
    return this.mutate(login, () => void (this.account(login).suspended = true));
  }

  resume(login: string) {
    return this.mutate(login, () => void (this.account(login).suspended = false));
  }

  /** Як у панелі: разом з користувачем — усі його обʼєкти */
  remove(login: string) {
    return this.mutate(login, () => {
      this.account(login);
      const state = this.state;
      state.accounts = state.accounts.filter((item) => item.login !== login);
      for (const key of ['sites', 'zones', 'mailDomains', 'boxes', 'databases', 'ftp', 'certificates', 'cron'] as const) {
        (state[key] as Array<{ owner: string | null }>) = (state[key] as Array<{ owner: string | null }>).filter((item) => item.owner !== login);
      }
    });
  }

  usage(login: string) {
    return this.read(() => {
      const account = this.account(login);
      const pkg = this.state.packages.find((item) => item.name === account.package);
      return {
        diskUsedMb: account.diskUsedMb,
        diskLimitMb: pkg?.diskMb ?? null,
        sitesUsed: this.state.sites.filter((site) => site.owner === login).length,
        sitesLimit: pkg?.sites ?? null,
      };
    });
  }

  async loginUrl(login: string) {
    await this.gate();
    this.account(login);
    return `https://example.com/?sandbox-panel=${encodeURIComponent(login)}`;
  }
}

class Sites extends SandboxSection implements SitesApi {
  list(owner?: string) {
    return this.read(() => this.owned(this.state.sites, owner));
  }

  create(input: Parameters<SitesApi['create']>[0]) {
    return this.mutate(input.name, () => {
      this.requireOwner(input.owner);
      this.unique(this.state.sites.some((site) => site.name === input.name), input.name);
      this.state.sites.push({ name: input.name, owner: input.owner, docroot: `/var/www/${input.owner}/data/www/${input.name}`, ips: ['203.0.113.10'], php: '8.3', ssl: false, active: true });
    });
  }

  remove(name: string) {
    return this.mutate(name, () => void (this.state.sites = this.state.sites.filter((site) => site.name !== name)));
  }
}

class Dns extends SandboxSection implements DnsApi {
  zones(owner?: string) {
    return this.read(() => this.owned(this.state.zones, owner));
  }

  createZone(input: Parameters<DnsApi['createZone']>[0]) {
    return this.mutate(input.name, () => {
      this.requireOwner(input.owner);
      this.unique(this.state.zones.some((zone) => zone.name === input.name), input.name);
      this.state.zones.push({ name: input.name, owner: input.owner, type: 'master', dnssec: null });
      this.state.records[input.name] = [{ key: `${input.name}. A ${input.ip}`, name: `${input.name}.`, type: 'A', value: input.ip, ttl: 3600 }];
    });
  }

  removeZone(name: string) {
    return this.mutate(name, () => {
      this.state.zones = this.state.zones.filter((zone) => zone.name !== name);
      delete this.state.records[name];
    });
  }

  records(zone: string) {
    return this.read(() => this.state.records[zone] ?? []);
  }

  addRecord(zone: string, record: Parameters<DnsApi['addRecord']>[1]) {
    return this.mutate(record.name, () => {
      if (!this.state.zones.some((item) => item.name === zone)) throw new PanelError(`Зони ${zone} не існує`, 'missed');
      const name = record.name.endsWith('.') ? record.name : `${record.name}.${zone}.`;
      const type = record.type.toUpperCase();
      (this.state.records[zone] ??= []).push({ key: `${name} ${type} ${record.value}`, name, type, value: record.value, ttl: record.ttl ?? 3600 });
    });
  }

  removeRecord(zone: string, key: string) {
    return this.mutate(key, () => void (this.state.records[zone] = (this.state.records[zone] ?? []).filter((record) => record.key !== key)));
  }
}

class Mail extends SandboxSection implements MailApi {
  domains(owner?: string) {
    return this.read(() => this.owned(this.state.mailDomains, owner));
  }

  createDomain(input: Parameters<MailApi['createDomain']>[0]) {
    return this.mutate(input.name, () => {
      this.requireOwner(input.owner);
      this.unique(this.state.mailDomains.some((domain) => domain.name === input.name), input.name);
      this.state.mailDomains.push({ name: input.name, owner: input.owner, active: true, dkim: false });
    });
  }

  removeDomain(name: string) {
    return this.mutate(name, () => {
      this.state.mailDomains = this.state.mailDomains.filter((domain) => domain.name !== name);
      this.state.boxes = this.state.boxes.filter((box) => !box.address.endsWith(`@${name}`));
    });
  }

  boxes(owner?: string) {
    return this.read(() => this.owned(this.state.boxes, owner));
  }

  createBox(input: Parameters<MailApi['createBox']>[0]) {
    const address = `${input.name}@${input.domain}`;
    return this.mutate(address, () => {
      this.requireOwner(input.owner);
      if (!this.state.mailDomains.some((domain) => domain.name === input.domain)) throw new PanelError(`Поштового домену ${input.domain} немає`, 'missed');
      this.unique(this.state.boxes.some((box) => box.address === address), address);
      this.state.boxes.push({ address, owner: input.owner, active: true, usedMb: 0, quotaMb: input.quotaMb ?? null, forward: null, note: null });
    });
  }

  removeBox(address: string) {
    return this.mutate(address, () => void (this.state.boxes = this.state.boxes.filter((box) => box.address !== address)));
  }

  setBoxPassword(address: string) {
    return this.mutate(address, () => {
      if (!this.state.boxes.some((box) => box.address === address)) throw new PanelError(`Скриньки ${address} немає`, 'missed');
    });
  }
}

class Databases extends SandboxSection implements DatabasesApi {
  list(owner?: string) {
    return this.read(() => this.owned(this.state.databases, owner));
  }

  create(input: Parameters<DatabasesApi['create']>[0]) {
    return this.mutate(input.name, () => {
      this.requireOwner(input.owner);
      this.unique(this.state.databases.some((db) => db.name === input.name), input.name);
      this.state.databases.push({ key: `${input.name}->MySQL`, name: input.name, owner: input.owner, server: 'MySQL', sizeMb: 0, users: 1 });
    });
  }

  remove(key: string) {
    return this.mutate(key, () => void (this.state.databases = this.state.databases.filter((db) => db.key !== key)));
  }
}

class Ftp extends SandboxSection implements FtpApi {
  list(owner?: string) {
    return this.read(() => this.owned(this.state.ftp, owner));
  }

  create(input: Parameters<FtpApi['create']>[0]) {
    return this.mutate(input.name, () => {
      this.requireOwner(input.owner);
      this.unique(this.state.ftp.some((user) => user.name === input.name), input.name);
      this.state.ftp.push({ name: input.name, owner: input.owner, home: input.home ?? '/' });
    });
  }

  remove(name: string) {
    return this.mutate(name, () => void (this.state.ftp = this.state.ftp.filter((user) => user.name !== name)));
  }
}

class Ssl extends SandboxSection implements SslApi {
  list(owner?: string) {
    return this.read(() => this.owned(this.state.certificates, owner));
  }
}

class Cron extends SandboxSection implements CronApi {
  list(owner?: string) {
    return this.read(() => this.owned(this.state.cron, owner));
  }

  create(input: Parameters<CronApi['create']>[0]) {
    return this.mutate(input.command, () => {
      this.requireOwner(input.owner);
      if (input.schedule.trim().split(/\s+/).length !== 5) throw new PanelError('Розклад: 5 полів cron', 'value');
      this.state.cron.push({ key: `${input.owner}:${Date.now()}`, owner: input.owner, command: input.command, schedule: input.schedule, description: input.description ?? null, active: true });
    });
  }

  remove(key: string) {
    return this.mutate(key, () => void (this.state.cron = this.state.cron.filter((job) => job.key !== key)));
  }
}

class System extends SandboxSection implements SystemApi {
  info() {
    return this.read(() => ({
      panel: 'Sandbox',
      version: '1.0.0',
      os: 'Linux (емуляція)',
      license: { id: 'SANDBOX', name: 'Технічна панель', expires: null },
      hardware: [
        { name: 'CPU', value: '4 × vCPU (емуляція)' },
        { name: 'RAM', value: '8 GiB' },
        { name: 'Disk', value: '200 GiB SSD' },
      ],
    }));
  }

  services() {
    return this.read(() => ['nginx', 'apache2', 'php-fpm', 'mysql', 'exim', 'dovecot', 'bind'].map((name) => ({ name, running: true, autostart: true })));
  }

  ips() {
    return this.read(() => ['203.0.113.10', '2001:db8::10']);
  }

  php() {
    return this.read(() => [
      { key: 'php82', name: '8.2.30', installed: true },
      { key: 'php83', name: '8.3.20', installed: true },
      { key: 'php84', name: '8.4.10', installed: false },
    ]);
  }
}

export class SandboxClient implements PanelClient {
  readonly accounts: Accounts;
  readonly sites: Sites;
  readonly dns: Dns;
  readonly mail: Mail;
  readonly databases: Databases;
  readonly ftp: Ftp;
  readonly ssl: Ssl;
  readonly cron: Cron;
  readonly system: System;

  constructor(private readonly connection: PanelConnection, readonly store: SandboxStore) {
    this.accounts = new Accounts(store, connection);
    this.sites = new Sites(store, connection);
    this.dns = new Dns(store, connection);
    this.mail = new Mail(store, connection);
    this.databases = new Databases(store, connection);
    this.ftp = new Ftp(store, connection);
    this.ssl = new Ssl(store, connection);
    this.cron = new Cron(store, connection);
    this.system = new System(store, connection);
  }

  async check() {
    await delay();
    if (this.connection.password === 'wrong') throw new PanelError('Invalid username or password', 'auth');
    return { accounts: this.store.state.accounts.length, packages: this.store.state.packages.length };
  }

  async diagnostics() {
    return { provider: 'sandbox', counts: Object.fromEntries(Object.entries(this.store.state).map(([key, value]) => [key, Array.isArray(value) ? value.length : Object.keys(value).length])) };
  }
}

export class SandboxProvider implements HostingProvider {
  readonly id = 'sandbox';
  readonly title = 'Sandbox (технічна)';
  readonly urlHint = 'sandbox://demo';
  readonly capabilities = RESOURCES;

  normalizeUrl(input: unknown): string {
    const value = String(input ?? '').trim().toLowerCase().replace(/\/+$/, '');
    if (!/^sandbox:\/\/[a-z0-9-]{1,32}$/.test(value)) throw new HttpError(400, 'Адреса технічної панелі: sandbox://<імʼя>');
    return value;
  }

  connect(connection: PanelConnection): PanelClient {
    return new SandboxClient(connection, SandboxStore.for(connection.url));
  }
}
