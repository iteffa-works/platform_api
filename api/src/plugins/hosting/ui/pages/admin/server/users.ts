/**
 * Користувачі панелі (з копії): привʼязані до платформи — перехід у картку акаунта,
 * вільні — привʼязати до користувача платформи; вхід у панель від імені (підтримка).
 */
import { ui, type UiButton, type UiNode } from '../../../../../../flowaxy/ui/index.js';
import { hosting } from '../../../../module.js';
import { formatSize, percent } from '../../../format.js';
import { datagrid, gridQuery, localGrid, searchBox } from '../../../grid.js';
import { ADMIN, badge, enc, panel, usageTone } from '../../../kit.js';
import type { ServerContext, ServerTab } from './context.js';

type PanelUser = Awaited<ReturnType<typeof hosting.servers.panelAccounts>>['accounts'][number];

/** Модальне вікно привʼязки: email власника, тариф, строк */
function linkDialog(page: ServerContext, user: PanelUser, plans: Array<{ id: number; name: string }>): UiButton {
  const { t } = page;
  return {
    type: 'button',
    label: t('linkAccount'),
    icon: 'plug',
    dialog: {
      title: t('linkTitle', { login: user.login }),
      nodes: [{
        type: 'form',
        layout: 'stack',
        fields: [
          { name: 'mode', kind: 'hidden', value: 'link' },
          { name: 'serverId', kind: 'hidden', value: String(page.server.id) },
          { name: 'login', kind: 'hidden', value: user.login },
          { name: 'email', kind: 'email', label: t('userEmail'), required: true },
          { name: 'planId', kind: 'select', label: t('col.plan'), options: [{ value: '', label: '—' }, ...plans.map((plan) => ({ value: String(plan.id), label: plan.name }))] },
          { name: 'paidUntil', kind: 'date', label: t('paidUntilField'), hint: t('paidUntilHint') },
        ],
        submit: { label: t('linkAccount'), action: { method: 'POST', url: `${ADMIN}/accounts`, success: { notice: t('created', { login: user.login }), redirect: `${ADMIN}/accounts/{account.id}` } } },
      }],
    },
  };
}

export const usersTab: ServerTab = async (page) => {
  const { t, ctx } = page;
  const [{ accounts: users }, plans] = await Promise.all([hosting.servers.panelAccounts(page.server.id), hosting.plans.list()]);
  const state = ['linked', 'free', 'suspended'].includes(ctx.state.users ?? '') ? ctx.state.users! : '';
  const visible = users.filter((user) =>
    !state
    || (state === 'linked' && user.accountId)
    || (state === 'free' && !user.accountId)
    || (state === 'suspended' && user.suspended));
  const query = gridQuery(ctx.state, ['login', 'package', 'disk'], 'login');
  const grid = localGrid(visible, query, {
    text: (user) => `${user.login} ${user.name ?? ''} ${user.package ?? ''}`,
    sort: { login: (user) => user.login, package: (user) => user.package, disk: (user) => user.diskUsedMb },
  });

  const actions = (user: PanelUser): UiButton[] => [
    ...(user.accountId ? [{ type: 'button' as const, label: t('openAccount'), icon: 'arrow', href: `${ADMIN}/accounts/${user.accountId}` }] : []),
    ...(page.manage ? [
      { type: 'button' as const, label: t('loginAs'), icon: 'external', action: { method: 'POST' as const, url: `${page.api}/users/${enc(user.login)}/login`, openUrl: 'url', success: { reload: false } } },
      ...(user.accountId ? [] : [linkDialog(page, user, plans)]),
    ] : []),
  ];

  const table: UiNode = datagrid({
    ctx,
    query: grid.query,
    total: grid.total,
    toolbar: {
      segments: {
        name: 'users',
        value: state,
        items: [
          { label: t('statusAll'), value: '', count: users.length },
          { label: t('platform'), value: 'linked', count: users.filter((user) => user.accountId).length },
          { label: t('notLinked'), value: 'free', count: users.filter((user) => !user.accountId).length },
          { label: t('status.suspended'), value: 'suspended', count: users.filter((user) => user.suspended).length },
        ],
      },
      search: searchBox(ctx, query),
    },
    columns: [
      { key: 'login', label: t('panelUser'), sortable: true },
      { key: 'package', label: t('package'), sortable: true },
      { key: 'disk', label: t('col.disk'), width: '180px', sortable: true },
      { key: 'status', label: t('status') },
      { key: 'actions', label: '', align: 'right', width: '1%' },
    ],
    rows: grid.rows.map((user) => {
      const fill = percent(user.diskUsedMb, user.diskLimitMb);
      return {
        key: user.login,
        tone: user.suspended ? 'danger' as const : undefined,
        cells: {
          login: [ui.text({ b: user.login }), ...(user.name ? [ui.muted(user.name)] : [])],
          package: [ui.text(user.package ?? '—', { size: 'sm' })],
          disk: [{ type: 'progress', value: fill, tone: usageTone(fill), label: `${formatSize(user.diskUsedMb)} / ${user.diskLimitMb ? formatSize(user.diskLimitMb) : '∞'}` }],
          status: [ui.row([
            badge(user.suspended ? t('status.suspended') : t('status.active'), user.suspended ? 'orange' : 'green'),
            user.accountId ? badge(t('platform'), 'blue') : badge(t('notLinked')),
          ])],
          actions: [{ type: 'actions', items: actions(user) }],
        },
      };
    }),
    empty: t('empty'),
  });

  return [panel(`${t('tab.users')} · ${users.length}`, [table], { flush: true, subtitle: t('usersHint') })];
};
