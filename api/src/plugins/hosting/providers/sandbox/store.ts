/**
 * Стан технічної панелі: у памʼяті + JSON у `DATA_DIR/hosting-sandbox/` (переживає перезапуск API).
 * Одна адреса `sandbox://<імʼя>` = одна незалежна «панель» з демо-даними.
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { config } from '../../../../config/index.js';
import type { Certificate, CronJob, Database, DnsRecord, DnsZone, FtpUser, Mailbox, MailDomain, PanelSite } from '../contracts.js';

export type SandboxAccount = {
  login: string;
  name: string | null;
  package: string | null;
  suspended: boolean;
  password: string;
  diskUsedMb: number;
};

export type SandboxState = {
  packages: Array<{ name: string; diskMb: number | null; sites: number | null }>;
  accounts: SandboxAccount[];
  sites: PanelSite[];
  zones: DnsZone[];
  records: Record<string, DnsRecord[]>;
  mailDomains: MailDomain[];
  boxes: Mailbox[];
  databases: Database[];
  ftp: FtpUser[];
  certificates: Certificate[];
  cron: CronJob[];
};

const IP = '203.0.113.10';

function seed(): SandboxState {
  const record = (name: string, type: string, value: string): DnsRecord => ({ key: `${name} ${type} ${value}`, name, type, value, ttl: 3600 });
  return {
    packages: [
      { name: 'basic', diskMb: 5120, sites: 3 },
      { name: 'pro', diskMb: 20480, sites: 10 },
      { name: 'business', diskMb: 51200, sites: null },
    ],
    accounts: [
      { login: 'demo', name: 'demo@example.com', package: 'pro', suspended: false, password: 'Demo12345678', diskUsedMb: 3420 },
      { login: 'shop', name: 'shop@example.com', package: 'basic', suspended: false, password: 'Shop12345678', diskUsedMb: 4710 },
      { login: 'archive', name: 'archive@example.com', package: 'basic', suspended: true, password: 'Arch12345678', diskUsedMb: 512 },
    ],
    sites: [
      { name: 'demo.example', owner: 'demo', docroot: '/var/www/demo/data/www/demo.example', ips: [IP], php: '8.3', ssl: true, active: true },
      { name: 'blog.demo.example', owner: 'demo', docroot: '/var/www/demo/data/www/blog.demo.example', ips: [IP], php: '8.2', ssl: false, active: true },
      { name: 'shop.example', owner: 'shop', docroot: '/var/www/shop/data/www/shop.example', ips: [IP], php: '8.3', ssl: true, active: true },
    ],
    zones: [
      { name: 'demo.example', owner: 'demo', type: 'master', dnssec: null },
      { name: 'shop.example', owner: 'shop', type: 'master', dnssec: 'signed' },
    ],
    records: {
      'demo.example': [record('demo.example.', 'A', IP), record('www.demo.example.', 'CNAME', 'demo.example.'), record('demo.example.', 'MX', 'mail.demo.example.'), record('demo.example.', 'TXT', 'v=spf1 a mx ~all')],
      'shop.example': [record('shop.example.', 'A', IP), record('shop.example.', 'TXT', 'v=spf1 a mx ~all')],
    },
    mailDomains: [{ name: 'demo.example', owner: 'demo', active: true, dkim: true }],
    boxes: [
      { address: 'info@demo.example', owner: 'demo', active: true, usedMb: 120, quotaMb: 1024, forward: null, note: null },
      { address: 'sales@demo.example', owner: 'demo', active: true, usedMb: 48, quotaMb: null, forward: 'boss@example.com', note: 'Продажі' },
    ],
    databases: [
      { key: 'demo_wp->MySQL', name: 'demo_wp', owner: 'demo', server: 'MySQL', sizeMb: 86, users: 1 },
      { key: 'shop_db->MySQL', name: 'shop_db', owner: 'shop', server: 'MySQL', sizeMb: 412, users: 2 },
    ],
    ftp: [{ name: 'demo_ftp', owner: 'demo', home: '/www/demo.example' }],
    certificates: [
      { key: 'demo%#%le.demo.example', name: 'le.demo.example', owner: 'demo', domains: ['demo.example', 'www.demo.example'], validUntil: '2027-02-01', letsencrypt: true, active: true },
      { key: 'shop%#%le.shop.example', name: 'le.shop.example', owner: 'shop', domains: ['shop.example'], validUntil: '2026-12-20', letsencrypt: true, active: true },
    ],
    cron: [{ key: 'demo:1', owner: 'demo', command: 'php /var/www/demo/data/www/demo.example/cron.php', schedule: '*/15 * * * *', description: 'WordPress cron', active: true }],
  };
}

const stores = new Map<string, SandboxStore>();

export class SandboxStore {
  readonly state: SandboxState;
  private readonly file: string;

  private constructor(url: string) {
    const dir = path.join(config.dataDir, 'hosting-sandbox');
    this.file = path.join(dir, `${createHash('sha1').update(url).digest('hex').slice(0, 16)}.json`);
    mkdirSync(dir, { recursive: true });
    this.state = this.load();
  }

  /** Один стан на адресу панелі */
  static for(url: string): SandboxStore {
    let store = stores.get(url);
    if (!store) {
      store = new SandboxStore(url);
      stores.set(url, store);
    }
    return store;
  }

  private load(): SandboxState {
    try {
      return { ...seed(), ...JSON.parse(readFileSync(this.file, 'utf8')) as Partial<SandboxState> };
    } catch {
      const state = seed();
      writeFileSync(this.file, JSON.stringify(state, null, 2));
      return state;
    }
  }

  save(): void {
    writeFileSync(this.file, JSON.stringify(this.state, null, 2));
  }

  /** Повернути демо-дані (тести, «скинути» в адмінці) */
  reset(): void {
    Object.assign(this.state, seed());
    this.save();
  }
}
