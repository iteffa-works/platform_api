import { randomBytes } from 'node:crypto';
import type { AccountsApi, AccountUsage, NewAccount, PanelAccount, PanelPackage } from '../../contracts.js';
import { limit, mb, parseMb } from '../mapper.js';
import { field, type IspElem } from '../transport.js';
import { IspResource } from './base.js';

/** Ліміт з форми шаблону: порожньо — без обмеження (null), число (МіБ / шт.) — як є, 0 — заборонено */
function count(form: IspElem, ...keys: string[]): number | null {
  for (const key of keys) {
    const raw = field(form, key).trim();
    if (!raw) continue;
    const value = parseMb(raw);
    if (value !== null) return value;
  }
  return null;
}

/** Прапорець з форми: перше знайдене поле */
function flag(form: IspElem, ...keys: string[]): boolean {
  return keys.some((key) => field(form, key) === 'on');
}

export function toPackage(name: string, form: IspElem): PanelPackage {
  const limits = Object.fromEntries(Object.keys(form).filter((key) => key.startsWith('limit_')).map((key) => [key, field(form, key)]));
  return {
    name,
    comment: field(form, 'comment') || field(form, 'note') || null,
    diskMb: count(form, 'limit_quota'),
    sites: count(form, 'limit_webdomains'),
    databases: count(form, 'limit_db'),
    mailboxes: count(form, 'limit_emails'),
    mailDomains: count(form, 'limit_emaildomains'),
    ftpUsers: count(form, 'limit_ftp_users'),
    cronJobs: count(form, 'limit_scheduler', 'limit_cron'),
    features: {
      backup: flag(form, 'backup', 'limit_backup'),
      ssh: flag(form, 'limit_shell'),
      nodejs: flag(form, 'limit_nodejs'),
      git: flag(form, 'limit_git', 'limit_gitrepos'),
      ssl: flag(form, 'limit_ssl'),
    },
    limits,
  };
}

/** Користувачі панелі (`user`), шаблони (`preset`), вхід без пароля (`session.newkey`) */
export class IspAccounts extends IspResource implements AccountsApi {
  private toAccount(elem: IspElem): PanelAccount {
    return {
      login: field(elem, 'name'),
      name: field(elem, 'fullname') || null,
      package: field(elem, 'preset') || null,
      suspended: field(elem, 'active') === 'off' || field(elem, 'blocked') === 'on',
      diskUsedMb: mb(elem, 'quota_used'),
      diskLimitMb: limit(elem, 'quota_total'),
      trafficUsedMb: mb(elem, 'traff_used'),
    };
  }

  async list(): Promise<PanelAccount[]> {
    return (await this.isp.list('user')).map((elem) => this.toAccount(elem)).filter((account) => account.login);
  }

  /**
   * Шаблони (`preset`) з лімітами з форми `preset.edit` (ті самі поля, що й у користувача: `limit_quota`,
   * `limit_webdomains`, …). У формі порожньо — без обмеження, `0` — заборонено.
   */
  async packages(): Promise<PanelPackage[]> {
    const names = (await this.isp.list('preset')).map((elem) => field(elem, 'name')).filter(Boolean);
    return Promise.all(names.map(async (name) => toPackage(name, await this.isp.call('preset.edit', { elid: name }))));
  }

  async create(input: NewAccount): Promise<void> {
    await this.isp.save('user.edit', {
      name: input.login,
      passwd: input.password,
      confirm: input.password,
      fullname: input.name,
      ...(input.package ? { preset: input.package } : {}),
    });
  }

  async setPackage(login: string, pkg: string): Promise<void> {
    await this.isp.save('user.edit', { elid: login, preset: pkg });
  }

  async setPassword(login: string, password: string): Promise<void> {
    await this.isp.save('user.edit', { elid: login, passwd: password, confirm: password });
  }

  async suspend(login: string): Promise<void> {
    await this.isp.call('user.suspend', { elid: login });
  }

  async resume(login: string): Promise<void> {
    await this.isp.call('user.resume', { elid: login });
  }

  async remove(login: string): Promise<void> {
    await this.delete('user', login);
  }

  /** Диск — зі списку (`quota_used` / `quota_total`, МіБ; 0 — без ліміту); сайти — `webdomain` від імені користувача */
  async usage(login: string): Promise<AccountUsage> {
    const [accounts, form, sites] = await Promise.all([
      this.isp.list('user'),
      this.isp.call('user.edit', { elid: login }),
      this.isp.list('webdomain', this.as(login)),
    ]);
    const elem = accounts.find((item) => field(item, 'name') === login) ?? {};
    return {
      diskUsedMb: mb(elem, 'quota_used'),
      diskLimitMb: limit(elem, 'quota_total') ?? limit(form, 'limit_quota'),
      sitesUsed: sites.length,
      sitesLimit: limit(form, 'limit_webdomains'),
    };
  }

  async loginUrl(login: string): Promise<string> {
    const key = randomBytes(16).toString('hex');
    await this.isp.save('session.newkey', { username: login, key });
    const query = new URLSearchParams({ func: 'auth', username: login, key, checkcookie: 'no' });
    return `${this.isp.url}/ispmgr?${query}`;
  }
}
