import { describe, expect, it } from 'vitest';
import { toPackage } from './resources/accounts.js';

/** Форма `preset.edit` як її віддає транспорт (значення — рядки; порожньо — без обмеження) */
const FREE = {
  name: 'flx-host-free',
  comment: 'Flowaxy Free',
  backup: 'off',
  limit_quota: '500',
  limit_traff: '5120',
  limit_db: '1',
  limit_db_users: '1',
  limit_ftp_users: '1',
  limit_webdomains: '1',
  limit_domains: '0',
  limit_emaildomains: '0',
  limit_emails: '0',
  limit_shell: 'off',
  limit_ssl: 'on',
  limit_nodejs: 'off',
};

const MAX = {
  name: 'flx-host-max',
  comment: 'Flowaxy Max',
  backup: 'on',
  limit_quota: '102400',
  limit_traff: '',
  limit_db: '',
  limit_webdomains: '',
  limit_emails: '',
  limit_scheduler: '100',
  limit_shell: 'on',
  limit_ssl: 'on',
  limit_nodejs: 'on',
};

describe('ISPmanager: шаблон користувача', () => {
  it('ліміти: число — як є, 0 — заборонено', () => {
    const pkg = toPackage('flx-host-free', FREE);
    expect(pkg).toMatchObject({ name: 'flx-host-free', comment: 'Flowaxy Free', diskMb: 500, sites: 1, databases: 1, mailboxes: 0, mailDomains: 0, ftpUsers: 1 });
    expect(pkg.features).toEqual({ backup: false, ssh: false, nodejs: false, git: false, ssl: true });
  });

  it('порожньо — без обмеження (null); можливості — прапорці on', () => {
    const pkg = toPackage('flx-host-max', MAX);
    expect(pkg).toMatchObject({ diskMb: 102400, sites: null, databases: null, mailboxes: null, cronJobs: 100 });
    expect(pkg.features).toMatchObject({ backup: true, ssh: true, nodejs: true });
  });

  it('усі сирі поля limit_* зберігаються для звірки', () => {
    expect(toPackage('flx-host-max', MAX).limits).toEqual({
      limit_quota: '102400', limit_traff: '', limit_db: '', limit_webdomains: '', limit_emails: '', limit_scheduler: '100',
      limit_shell: 'on', limit_ssl: 'on', limit_nodejs: 'on',
    });
  });
});
