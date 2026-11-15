import { randomBytes } from 'node:crypto';
import type { AccountsApi, AccountUsage, NewAccount, PanelAccount } from '../../contracts.js';
import { limit, mb } from '../mapper.js';
import { field, type IspElem } from '../transport.js';
import { IspResource } from './base.js';

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

  async packages(): Promise<string[]> {
    return (await this.isp.list('preset')).map((elem) => field(elem, 'name')).filter(Boolean);
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
