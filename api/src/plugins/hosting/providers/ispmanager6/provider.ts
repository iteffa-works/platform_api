/** ISPmanager 6 (Lite / Host / Business): провайдер і клієнт — композиція розділів панелі */
import { normalizeHttpUrl } from '../../domain/url.js';
import { RESOURCES, type HostingProvider, type PanelClient, type PanelConnection } from '../contracts.js';
import { IspAccounts } from './resources/accounts.js';
import { IspCron } from './resources/cron.js';
import { IspDatabases } from './resources/databases.js';
import { IspDns } from './resources/dns.js';
import { IspFtp } from './resources/ftp.js';
import { IspMail } from './resources/mail.js';
import { IspSites } from './resources/sites.js';
import { IspSsl } from './resources/ssl.js';
import { IspSystem } from './resources/system.js';
import { field, forgetSession, IspTransport } from './transport.js';

const SECRET_KEYS = /pass|secret|key|token|auth|dkim/i;

/** Маска секретних полів у діагностиці */
function redact(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(redact);
  if (!node || typeof node !== 'object') return node;
  return Object.fromEntries(Object.entries(node as Record<string, unknown>)
    .map(([key, value]) => [key, SECRET_KEYS.test(key) ? '***' : redact(value)]));
}

export class IspManager6Client implements PanelClient {
  private readonly isp: IspTransport;
  readonly accounts: IspAccounts;
  readonly sites: IspSites;
  readonly dns: IspDns;
  readonly mail: IspMail;
  readonly databases: IspDatabases;
  readonly ftp: IspFtp;
  readonly ssl: IspSsl;
  readonly cron: IspCron;
  readonly system: IspSystem;

  constructor(connection: PanelConnection) {
    this.isp = new IspTransport(connection);
    this.accounts = new IspAccounts(this.isp);
    this.sites = new IspSites(this.isp);
    this.dns = new IspDns(this.isp);
    this.mail = new IspMail(this.isp);
    this.databases = new IspDatabases(this.isp);
    this.ftp = new IspFtp(this.isp);
    this.ssl = new IspSsl(this.isp);
    this.cron = new IspCron(this.isp);
    this.system = new IspSystem(this.isp);
  }

  async check() {
    const [accounts, packages] = await Promise.all([this.accounts.list(), this.accounts.packages()]);
    return { accounts: accounts.length, packages: packages.length };
  }

  async diagnostics(login?: string) {
    const [users, presets] = await Promise.all([this.isp.list('user'), this.isp.list('preset')]);
    const user = login ? users.find((item) => field(item, 'name') === login) : users[0];
    const name = user ? field(user, 'name') : null;
    return redact({
      userListFields: Object.keys(users[0] ?? {}),
      presetFields: Object.keys(presets[0] ?? {}),
      sampleUser: user ?? null,
      sampleSite: name ? (await this.isp.list('webdomain', { su: name }))[0] ?? null : null,
    }) as Record<string, unknown>;
  }
}

export class IspManager6Provider implements HostingProvider {
  readonly id = 'ispmanager6';
  readonly title = 'ISPmanager 6';
  readonly urlHint = 'https://host:1500';
  readonly capabilities = RESOURCES;

  normalizeUrl(input: unknown): string {
    return normalizeHttpUrl(input, '/ispmgr');
  }

  connect(connection: PanelConnection): PanelClient {
    return new IspManager6Client(connection);
  }

  forgetSession(url: string, username: string): void {
    forgetSession(url, username);
  }
}
