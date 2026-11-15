/** Користувачі панелі: квоти, привʼязка до платформи, вхід від імені, блокування, пароль, видалення */
import { ui, type UiButton, type UiNode } from '../../../../../../core/ui/index.js';
import { hosting } from '../../../../module.js';
import { formatSize } from '../../../format.js';
import { ADMIN, badge, dialogButton, enc, panel, secretResult, usagePercent, usageTone } from '../../../kit.js';
import type { ConsoleSection } from './context.js';

export const usersSection: ConsoleSection = async (console) => {
  const { t } = console;
  const [{ accounts }, { packages }] = await Promise.all([
    hosting.servers.panelAccounts(console.server.id),
    hosting.servers.packages(console.server.id).catch(() => ({ packages: [] as string[] })),
  ]);
  const state = ['active', 'suspended', 'linked', 'free'].includes(console.ctx.state.users ?? '') ? console.ctx.state.users! : '';
  const visible = accounts.filter((user) =>
    !state
    || (state === 'active' && !user.suspended)
    || (state === 'suspended' && user.suspended)
    || (state === 'linked' && user.linked)
    || (state === 'free' && !user.linked));
  const pkg = packages.includes(console.ctx.state.package ?? '') ? console.ctx.state.package! : '';
  const filtered = pkg ? visible.filter((user) => user.package === pkg) : visible;

  const actions: UiNode[] = console.manage ? [dialogButton(t('newPanelUser'), t('newPanelUser'), [{
    type: 'form',
    layout: 'stack',
    fields: [
      { name: 'login', kind: 'text', label: t('accountName'), required: true, autocomplete: 'off', hint: t('accountNameHint') },
      { name: 'name', kind: 'text', label: t('fullName') },
      { name: 'package', kind: 'select', label: t('package'), options: [{ value: '', label: t('noPackage') }, ...packages.map((name) => ({ value: name, label: name }))] },
      { name: 'password', kind: 'password', label: t('passwordGenerate'), autocomplete: 'new-password', hint: t('passwordGenerateHint') },
    ],
    footer: [ui.muted(t('panelUserHint'))],
    submit: { label: t('create'), action: { method: 'POST', url: `${console.api}/users`, success: { notice: t('created', { login: '{login}' }), result: secretResult(console.ctx) } } },
  }])] : [];

  const rowActions = (user: (typeof accounts)[number]): UiButton[] => {
    if (!console.manage) return [];
    const url = `${console.api}/users/${enc(user.login)}`;
    return [
      { type: 'button', label: t('loginAs'), icon: 'external', action: { method: 'POST', url: `${url}/login`, openUrl: 'url', success: { reload: false } } },
      { type: 'button', label: t('tab.sites'), icon: 'apps', href: `${console.page}?tab=sites&owner=${enc(user.login)}` },
      user.suspended
        ? { type: 'button', label: t('resume'), icon: 'check', action: { method: 'POST', url: `${url}/resume` } }
        : { type: 'button', label: t('suspend'), icon: 'lock', action: { method: 'POST', url: `${url}/suspend`, confirm: t('suspendConfirm', { login: user.login }) } },
      { type: 'button', label: t('resetPassword'), icon: 'key', action: { method: 'POST', url: `${url}/password`, confirm: t('resetPasswordConfirm', { login: user.login }), success: { result: secretResult(console.ctx), reload: false } } },
      ...(user.linked ? [] : [{ type: 'button' as const, label: t('delete'), icon: 'trash', variant: 'danger' as const, action: { method: 'DELETE' as const, url, confirm: t('deletePanelUserConfirm', { login: user.login }) } }]),
    ];
  };

  const grid = await console.grid(filtered, {
    defaultSort: 'login',
    sort: { login: (user) => user.login, package: (user) => user.package, disk: (user) => user.diskUsedMb },
    text: (user) => `${user.login} ${user.name ?? ''} ${user.package ?? ''}`,
    segments: {
      name: 'users',
      value: state,
      items: [
        { label: t('statusAll'), value: '', count: accounts.length },
        { label: t('status.active'), value: 'active', count: accounts.filter((user) => !user.suspended).length },
        { label: t('status.suspended'), value: 'suspended', count: accounts.filter((user) => user.suspended).length },
        { label: t('platform'), value: 'linked', count: accounts.filter((user) => user.linked).length },
        { label: t('notLinked'), value: 'free', count: accounts.filter((user) => !user.linked).length },
      ],
    },
    extraFilters: packages.length ? [{ name: 'package', label: t('package'), value: pkg, options: [{ value: '', label: t('allPackages') }, ...packages.map((name) => ({ value: name, label: name }))] }] : [],
    columns: [
      { key: 'login', label: t('panelUser') },
      { key: 'package', label: t('package') },
      { key: 'disk', label: t('col.disk'), width: '180px' },
      { key: 'link', label: t('platform') },
      { key: 'status', label: t('status') },
      { key: 'actions', label: '', align: 'right', width: '1%' },
    ],
    row: (user) => {
      const percent = usagePercent(user.diskUsedMb, user.diskLimitMb);
      return {
        key: user.login,
        tone: user.suspended ? 'danger' : undefined,
        cells: {
          login: [ui.text({ b: user.login }), ...(user.name ? [ui.muted(user.name)] : [])],
          package: [ui.text(user.package ?? '—', { size: 'sm' })],
          disk: [{ type: 'progress', value: percent, tone: usageTone(percent), label: `${formatSize(user.diskUsedMb)} / ${user.diskLimitMb ? formatSize(user.diskLimitMb) : '∞'}` }],
          link: user.accountId ? [{ type: 'link', text: t('linkedAccount'), href: `${ADMIN}/accounts?q=${enc(user.login)}` }] : [ui.muted('—')],
          status: [badge(user.suspended ? t('status.suspended') : t('status.active'), user.suspended ? 'orange' : 'green')],
          actions: [{ type: 'actions', items: rowActions(user) }],
        },
      };
    },
    empty: t('empty'),
  });

  return [panel(`${t('tab.users')} · ${accounts.length}`, [grid], { flush: true, actions, subtitle: t('usersHint') })];
};
