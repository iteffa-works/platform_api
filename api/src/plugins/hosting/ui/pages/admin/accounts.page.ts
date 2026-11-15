/**
 * /admin/hosting/accounts — акаунти платформи. Фільтри (стан, сервер, тариф), пошук, сортування й сторінка —
 * у SQL; рядок — тон за станом / строком; дії — іконки; створення / привʼязка — модальне вікно в шапці.
 */
import { ui, type GridTone, type UiButton, type UiContext, type UiField, type UiNode, type UiPage } from '../../../../../core/ui/index.js';
import { hosting } from '../../../module.js';
import { ACCOUNT_SORT_KEYS } from '../../../services/account.service.js';
import type { AccountView } from '../../../services/presenter.js';
import { daysLeft, formatSize } from '../../format.js';
import { datagrid, gridQuery, searchBox } from '../../grid.js';
import { ADMIN, badge, errorBanner, secretResult, usagePercent, usageTone } from '../../kit.js';

const STATUSES = ['active', 'suspended', 'pending', 'deleted'] as const;
const STATUS_TONE: Record<string, 'green' | 'blue' | 'orange' | 'slate'> = { active: 'green', pending: 'blue', suspended: 'orange', deleted: 'slate' };

function rowTone(account: AccountView): GridTone | undefined {
  if (account.status === 'deleted') return 'muted';
  if (account.status === 'suspended') return 'danger';
  const days = daysLeft(account.paidUntil);
  return account.status === 'active' && days !== null && days <= 7 ? 'warn' : undefined;
}

function icon(label: string, iconName: string, extra: Partial<UiButton>): UiButton {
  return { type: 'button', label, icon: iconName, ...extra };
}

function rowActions(ctx: UiContext, account: AccountView): UiButton[] {
  if (account.status === 'deleted') return [];
  const url = `${ADMIN}/accounts/${account.id}`;
  return [
    icon(ctx.t('loginAs'), 'external', { action: { method: 'POST', url: `${url}/login`, openUrl: 'url', success: { reload: false } } }),
    icon(ctx.t('refresh'), 'refresh', { action: { method: 'POST', url: `${url}/usage` } }),
    icon(ctx.t('term'), 'calendar', { action: { method: 'PATCH', url, prompt: { message: ctx.t('paidUntilPrompt'), field: 'paidUntil', value: account.paidUntil ? new Date(account.paidUntil).toISOString().slice(0, 10) : '' } } }),
    account.status === 'active'
      ? icon(ctx.t('suspend'), 'lock', { action: { method: 'POST', url: `${url}/suspend`, confirm: ctx.t('suspendConfirm', { login: account.login }) } })
      : icon(ctx.t('resume'), 'check', { action: { method: 'POST', url: `${url}/resume` } }),
    icon(ctx.t('deleteKeep'), 'close', { action: { method: 'DELETE', url, body: { removeFromPanel: false }, confirm: ctx.t('adminDeleteConfirm', { login: account.login }) } }),
    icon(ctx.t('deleteWithPanel'), 'trash', { variant: 'danger', action: { method: 'DELETE', url, body: { removeFromPanel: true }, confirm: ctx.t('deleteFromPanelConfirm', { login: account.login }) } }),
  ];
}

/** Модальне вікно «Новий акаунт»: режим і сервер — живі поля (перерендер зберігає відкрите вікно) */
async function createDialog(ctx: UiContext, servers: Array<{ id: number; name: string; isActive: boolean }>, plans: Array<{ id: number; name: string }>): Promise<UiButton | null> {
  const active = servers.filter((server) => server.isActive);
  if (!active.length) return null;
  const mode = ctx.state.mode === 'link' ? 'link' : 'create';
  const serverId = active.find((server) => String(server.id) === ctx.state.serverId)?.id ?? active[0]!.id;
  let loginField: UiField = { name: 'login', kind: 'text', label: ctx.t('accountName'), required: true, autocomplete: 'off', value: ctx.state.login ?? '', hint: ctx.t('accountNameHint') };
  const extra: UiNode[] = [];
  if (mode === 'link') {
    try {
      const free = (await hosting.servers.panelAccounts(serverId)).accounts.filter((item) => !item.linked);
      loginField = { name: 'login', kind: 'select', label: ctx.t('panelUser'), required: true, options: free.map((item) => ({ value: item.login, label: item.package ? `${item.login} · ${item.package}` : item.login })) };
    } catch (error) {
      extra.push(errorBanner(ctx, error));
    }
  }
  return {
    type: 'button',
    label: ctx.t('newAccount'),
    icon: 'plus',
    dialog: {
      title: ctx.t('newAccountAdmin'),
      nodes: [{
        type: 'form',
        layout: 'stack',
        fields: [
          { name: 'mode', kind: 'choice', value: mode, live: true, options: [{ value: 'create', label: ctx.t('mode.create') }, { value: 'link', label: ctx.t('mode.link') }] },
          { name: 'serverId', kind: 'select', label: ctx.t('server'), value: String(serverId), live: true, options: active.map((server) => ({ value: String(server.id), label: server.name })) },
          { name: 'email', kind: 'email', label: ctx.t('userEmail'), required: true, value: ctx.state.email ?? '' },
          loginField,
          { name: 'planId', kind: 'select', label: ctx.t('col.plan'), value: ctx.state.planId ?? '', options: [{ value: '', label: '—' }, ...plans.map((plan) => ({ value: String(plan.id), label: plan.name }))] },
          ...(mode === 'create' ? [{ name: 'password', kind: 'password' as const, label: ctx.t('passwordGenerate'), autocomplete: 'new-password' }] : []),
          { name: 'paidUntil', kind: 'date', label: ctx.t('paidUntilField'), hint: ctx.t('paidUntilHint') },
        ],
        footer: extra,
        submit: {
          label: mode === 'create' ? ctx.t('create') : ctx.t('link'),
          action: { method: 'POST', url: `${ADMIN}/accounts`, success: { notice: ctx.t('created', { login: '{account.login}' }), result: secretResult(ctx) } },
        },
      }],
    },
  };
}

export const accountsPage: UiPage = {
  path: `${ADMIN}/accounts`,
  section: 'admin',
  title: 'nav.accounts',
  subtitle: 'accounts.subtitle',
  permission: ['hosting', 'view'],
  async render(ctx) {
    const manage = ctx.can('hosting', 'manage');
    const query = gridQuery(ctx.state, ACCOUNT_SORT_KEYS, '-created');
    const status = (STATUSES as readonly string[]).includes(ctx.state.status ?? '') ? ctx.state.status! : '';
    const serverId = Number(ctx.state.server) || undefined;
    const planId = Number(ctx.state.plan) || undefined;

    const [{ servers }, plans, counts, found] = await Promise.all([
      hosting.servers.list(),
      hosting.plans.list(),
      hosting.accounts.statusCounts({ serverId, planId }),
      hosting.accounts.search({ status, serverId, planId, q: query.q, sort: query.sort, limit: query.perPage, offset: query.offset }),
    ]);
    const current = Object.entries(counts).filter(([key]) => key !== 'deleted').reduce((sum, [, total]) => sum + total, 0);

    const grid = datagrid({
      ctx,
      query,
      total: found.total,
      toolbar: {
        segments: {
          name: 'status',
          value: status,
          items: [
            { label: ctx.t('filter.current'), value: '', count: current },
            ...STATUSES.map((value) => ({ label: ctx.t(`status.${value}`), value, count: counts[value] ?? 0 })),
          ],
        },
        filters: [
          { name: 'server', label: ctx.t('server'), value: serverId ? String(serverId) : '', options: [{ value: '', label: ctx.t('allServers') }, ...servers.map((server) => ({ value: String(server.id), label: server.name }))] },
          { name: 'plan', label: ctx.t('col.plan'), value: planId ? String(planId) : '', options: [{ value: '', label: ctx.t('allPlans') }, ...plans.map((plan) => ({ value: String(plan.id), label: plan.name }))] },
        ],
        search: searchBox(ctx, query, ctx.t('searchAccounts')),
      },
      columns: [
        { key: 'login', label: ctx.t('col.name'), sortable: true },
        { key: 'user', label: ctx.t('user') },
        { key: 'plan', label: ctx.t('col.plan') },
        { key: 'disk', label: ctx.t('col.disk'), width: '170px', sortable: true },
        { key: 'paid', label: ctx.t('paidUntilField'), sortable: true },
        { key: 'status', label: ctx.t('status') },
        ...(manage ? [{ key: 'actions', label: '', align: 'right' as const, width: '1%' }] : []),
        { key: 'created', label: '#', width: '1%', sortable: true },
      ],
      rows: found.accounts.map((account) => {
        const days = daysLeft(account.paidUntil);
        const percent = usagePercent(account.usage.diskUsedMb, account.usage.diskLimitMb);
        return {
          key: account.id,
          tone: rowTone(account),
          cells: {
            login: [
              ui.text({ b: account.login }),
              account.serverId ? { type: 'link', text: account.server?.name ?? '—', href: `${ADMIN}/servers/${account.serverId}?tab=users` } : ui.muted('—'),
            ],
            user: account.user ? [{ type: 'person', name: account.user.email, caption: account.note ?? undefined, seed: account.user.email }] : [ui.muted('—')],
            plan: [ui.text(account.plan?.name ?? account.package ?? '—')],
            disk: [{ type: 'progress', value: percent, tone: usageTone(percent), label: `${formatSize(account.usage.diskUsedMb)} / ${formatSize(account.usage.diskLimitMb)}` }],
            paid: account.paidUntil
              ? [ui.text(ui.date(account.paidUntil)), ui.text(days !== null && days >= 0 ? ctx.t('daysLeft', { days }) : ctx.t('overdue', { days: -(days ?? 0) }), { size: 'sm', tone: days !== null && days <= 7 ? 'warn' : 'muted' })]
              : [ui.muted(ctx.t('noTerm'))],
            status: [
              badge(ctx.t(`status.${account.status}`), STATUS_TONE[account.status]),
              ...(account.suspendReason ? [ui.muted(ctx.t(`reason.${account.suspendReason}`))] : []),
            ],
            actions: [{ type: 'actions', items: rowActions(ctx, account) }],
            created: [ui.muted(String(account.id))],
          },
        };
      }),
      empty: ctx.t('noAccounts'),
    });

    const create = manage ? await createDialog(ctx, servers, plans) : null;
    return { nodes: [grid], actions: create ? [create] : [] };
  },
};
