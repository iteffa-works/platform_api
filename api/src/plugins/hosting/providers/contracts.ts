/**
 * Контракт панелі хостингу. Сервіси хостингу (тарифи, замовлення, білінг, адмінка) працюють лише через нього.
 * Нова панель = тека `providers/<id>/` з класом, що реалізує `HostingProvider`, + рядок у `providers/registry.ts`.
 *
 * Ресурси згруповано за розділами панелі; кожен метод з `owner` діє від імені користувача панелі
 * (без owner — усі обʼєкти, бачення адміністратора).
 */

export type PanelConnection = {
  /** Адреса панелі, напр. `https://isp.example.com:1500` або `sandbox://demo` */
  url: string;
  username: string;
  password: string;
  verifyTls: boolean;
};

/** Помилка панелі (текст — з панелі); сервіси перетворюють на 502 */
export class PanelError extends Error {
  constructor(message: string, readonly code: string) {
    super(message);
    this.name = 'PanelError';
  }
}

/** Розділи панелі; провайдер оголошує, які підтримує — адмінка показує лише їх */
export const RESOURCES = ['accounts', 'sites', 'dns', 'mail', 'databases', 'ftp', 'ssl', 'cron', 'system'] as const;
export type ResourceKind = (typeof RESOURCES)[number];

/* ---------- Записи ---------- */

export type PanelAccount = {
  login: string;
  name: string | null;
  package: string | null;
  suspended: boolean;
  diskUsedMb: number | null;
  /** null — без ліміту */
  diskLimitMb: number | null;
  trafficUsedMb: number | null;
};

export type NewAccount = { login: string; password: string; package: string | null; name: string };

export type AccountUsage = {
  diskUsedMb: number | null;
  diskLimitMb: number | null;
  sitesUsed: number | null;
  sitesLimit: number | null;
};

export type PanelSite = {
  name: string;
  owner: string;
  docroot: string | null;
  ips: string[];
  php: string | null;
  ssl: boolean;
  active: boolean;
};

export type NewSite = { owner: string; name: string; aliases?: string };

export type DnsZone = { name: string; owner: string; type: string; dnssec: string | null };
export type NewDnsZone = { owner: string; name: string; ip: string };
export type DnsRecord = { key: string; name: string; type: string; value: string; ttl: number | null };
export type NewDnsRecord = { name: string; type: string; value: string; ttl?: number; priority?: number };

export type MailDomain = { name: string; owner: string; active: boolean; dkim: boolean };
export type NewMailDomain = { owner: string; name: string };
export type Mailbox = { address: string; owner: string; active: boolean; usedMb: number | null; quotaMb: number | null; forward: string | null; note: string | null };
export type NewMailbox = { owner: string; name: string; domain: string; password: string; quotaMb?: number };

export type Database = { key: string; name: string; owner: string; server: string; sizeMb: number | null; users: number };
export type NewDatabase = { owner: string; name: string; user: string; password: string; charset?: string };

export type FtpUser = { name: string; owner: string; home: string | null };
export type NewFtpUser = { owner: string; name: string; password: string; home?: string };

export type Certificate = { key: string; name: string; owner: string; domains: string[]; validUntil: string | null; letsencrypt: boolean; active: boolean };

export type CronJob = { key: string; owner: string | null; command: string; schedule: string; description: string | null; active: boolean };
/** schedule — 5 полів cron: «хв год день міс день_тижня» */
export type NewCronJob = { owner: string; command: string; schedule: string; description?: string };

export type SystemInfo = {
  panel: string;
  version: string | null;
  os: string | null;
  license: { id: string | null; name: string | null; expires: string | null } | null;
  hardware: Array<{ name: string; value: string }>;
};
export type ServiceState = { name: string; running: boolean; autostart: boolean };
export type PhpVersion = { key: string; name: string; installed: boolean };

/* ---------- Розділи ---------- */

export interface AccountsApi {
  list(): Promise<PanelAccount[]>;
  packages(): Promise<string[]>;
  create(input: NewAccount): Promise<void>;
  setPackage(login: string, pkg: string): Promise<void>;
  setPassword(login: string, password: string): Promise<void>;
  suspend(login: string): Promise<void>;
  resume(login: string): Promise<void>;
  remove(login: string): Promise<void>;
  usage(login: string): Promise<AccountUsage>;
  /** Одноразове посилання входу в панель без пароля */
  loginUrl(login: string): Promise<string>;
}

export interface SitesApi {
  list(owner?: string): Promise<PanelSite[]>;
  create(input: NewSite): Promise<void>;
  remove(name: string, owner?: string): Promise<void>;
}

export interface DnsApi {
  zones(owner?: string): Promise<DnsZone[]>;
  createZone(input: NewDnsZone): Promise<void>;
  removeZone(name: string, owner?: string): Promise<void>;
  records(zone: string): Promise<DnsRecord[]>;
  addRecord(zone: string, record: NewDnsRecord): Promise<void>;
  removeRecord(zone: string, key: string): Promise<void>;
}

export interface MailApi {
  domains(owner?: string): Promise<MailDomain[]>;
  createDomain(input: NewMailDomain): Promise<void>;
  removeDomain(name: string, owner?: string): Promise<void>;
  boxes(owner?: string): Promise<Mailbox[]>;
  createBox(input: NewMailbox): Promise<void>;
  removeBox(address: string, owner?: string): Promise<void>;
  setBoxPassword(address: string, password: string, owner?: string): Promise<void>;
}

export interface DatabasesApi {
  list(owner?: string): Promise<Database[]>;
  create(input: NewDatabase): Promise<void>;
  remove(key: string, owner?: string): Promise<void>;
}

export interface FtpApi {
  list(owner?: string): Promise<FtpUser[]>;
  create(input: NewFtpUser): Promise<void>;
  remove(name: string, owner?: string): Promise<void>;
}

export interface SslApi {
  list(owner?: string): Promise<Certificate[]>;
}

export interface CronApi {
  list(owner?: string): Promise<CronJob[]>;
  create(input: NewCronJob): Promise<void>;
  remove(key: string, owner?: string): Promise<void>;
}

export interface SystemApi {
  info(): Promise<SystemInfo>;
  services(): Promise<ServiceState[]>;
  ips(): Promise<string[]>;
  php(): Promise<PhpVersion[]>;
}

/** Підключення до однієї панелі */
export interface PanelClient {
  /** Вхід + базові списки; кидає PanelError */
  check(): Promise<{ accounts: number; packages: number }>;
  readonly accounts: AccountsApi;
  readonly sites: SitesApi;
  readonly dns: DnsApi;
  readonly mail: MailApi;
  readonly databases: DatabasesApi;
  readonly ftp: FtpApi;
  readonly ssl: SslApi;
  readonly cron: CronApi;
  readonly system: SystemApi;
  /** Сирі поля панелі для налаштування інтеграції (без паролів) */
  diagnostics(login?: string): Promise<Record<string, unknown>>;
}

export interface HostingProvider {
  readonly id: string;
  readonly title: string;
  /** Приклад адреси для форми сервера */
  readonly urlHint: string;
  /** Підтримувані розділи (адмінка ховає решту) */
  readonly capabilities: readonly ResourceKind[];
  /** Нормалізувати / перевірити адресу панелі; помилка — повідомлення для адміністратора */
  normalizeUrl(input: unknown): string;
  connect(connection: PanelConnection): PanelClient;
  /** Забути кешовану сесію (змінились облікові дані / адреса) */
  forgetSession?(url: string, username: string): void;
}
