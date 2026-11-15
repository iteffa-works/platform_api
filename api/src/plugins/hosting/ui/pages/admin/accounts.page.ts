/** /admin/hosting/accounts — акаунти платформи: фільтр стану, створення / привʼязка, строк, блокування, видалення */
import { ui, type Tone, type UiField, type UiNode, type UiPage } from '../../../../../core/ui/index.js';
import { hosting } from '../../../module.js';
import { daysLeft, formatSize } from '../../format.js';
import { action, ADMIN, badge, dialogButton, errorBanner, menu, panel, removeAction, secretResult, table, usagePercent, usageTone } from '../../kit.js';

const STATUS_TONE: Record<string, Tone> = { active: 'green', pending: 'blue', suspended: 'orange', deleted: 'slate' };
const STATUSES = ['active', 'suspended', 'pending', 'deleted'];

export const accountsPage: UiPage = {
  path: `${ADMIN}/accounts`,
  section: 'admin',
  title: 'nav.accounts',
  subtitle: 'accounts.subtitle',
  permission: ['hosting', 'view'],
  async render(ctx) {
    const manage = ctx.can('hosting', 'manage');
    const status = STATUSES.includes(ctx.state.status ?? '') ? ctx.state.status! : '';
    const [{ accounts }, { servers }, plans] = await Promise.all([
      hosting.accounts.list({ status: status || undefined }),
      hosting.servers.list(),
      hosting.plans.list(),
    ]);
    const active = servers.filter((server) => server.isActive);

    /* Форма створення / привʼязки — у модальному вікні; режим і сервер — живі поля */
    const actions: UiNode[] = [];
    if (manage && active.length) {
      const mode = ctx.state.mode === 'link' ? 'link' : 'create';
      const serverId = active.find((server) => String(server.id) === ctx.state.serverId)?.id ?? active[0]!.id;
      let loginField: UiField = { name: 'login', kind: 'text', label: ctx.t('accountName'), required: true, autocomplete: 'off', value: ctx.state.login ?? '', hint: ctx.t('accountNameHint') };
      const extra: UiNode[] = [];
      if (mode === 'link') {
        try {
          const free = (await hosting.servers.panelAccounts(serverId)).accounts.filter((item) => !item.linked);
          loginField = {
            name: 'login', kind: 'select', label: ctx.t('panelUser'), required: true,
            options: free.map((item) => ({ value: item.login, label: item.package ? `${item.login} · ${item.package}` : item.login })),
          };
        } catch (error) {
          extra.push(errorBanner(ctx, error));
        }
      }
      actions.push(dialogButton(ctx.t('newAccount'), ctx.t('newAccountAdmin'), [{
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
      }]));
    }

    const tabs = ['', ...STATUSES].map((value) => ({
      label: value ? ctx.t(`status.${value}`) : ctx.t('filter.current'),
      href: value ? `${ADMIN}/accounts?status=${value}` : `${ADMIN}/accounts`,
      active: value === status,
    }));

    return [
      { type: 'tabs', items: tabs },
      panel(`${ctx.t('accounts')} · ${accounts.length}`, [table(
        [
          { key: 'name', label: ctx.t('col.name') },
          { key: 'user', label: ctx.t('user') },
          { key: 'plan', label: ctx.t('col.plan') },
          { key: 'disk', label: ctx.t('col.disk'), width: '160px' },
          { key: 'paid', label: ctx.t('paidUntilField') },
          { key: 'status', label: ctx.t('status') },
          { key: 'actions', label: '', align: 'right', width: '48px' },
        ],
        accounts.map((account) => {
          const days = daysLeft(account.paidUntil);
          const url = `${ADMIN}/accounts/${account.id}`;
          const percent = usagePercent(account.usage.diskUsedMb, account.usage.diskLimitMb);
          return {
            key: account.id,
            muted: account.status === 'deleted',
            cells: {
              name: [
                ui.text({ b: account.login }),
                account.serverId ? { type: 'link', text: account.server?.name ?? '—', href: `${ADMIN}/servers/${account.serverId}?tab=users` } : ui.muted('—'),
              ],
              user: [ui.text(account.user?.email ?? '—', { size: 'sm' })],
              plan: [ui.text(account.plan?.name ?? account.package ?? '—')],
              disk: [{ type: 'progress', value: percent, tone: usageTone(percent), label: `${formatSize(account.usage.diskUsedMb)} / ${formatSize(account.usage.diskLimitMb)}` }],
              paid: account.paidUntil
                ? [ui.text(ui.date(account.paidUntil)), ui.text(days !== null && days >= 0 ? ctx.t('daysLeft', { days }) : ctx.t('overdue', { days: -(days ?? 0) }), { size: 'sm', tone: days !== null && days <= 7 ? 'warn' : 'muted' })]
                : [ui.muted(ctx.t('noTerm'))],
              status: [
                badge(ctx.t(`status.${account.status}`), STATUS_TONE[account.status]),
                ...(account.suspendReason ? [ui.muted(ctx.t(`reason.${account.suspendReason}`))] : []),
              ],
              actions: manage && account.status !== 'deleted' ? [menu([
                action(ctx.t('loginAs'), { method: 'POST', url: `${url}/login`, openUrl: 'url', success: { reload: false } }),
                action(ctx.t('refresh'), { method: 'POST', url: `${url}/usage` }),
                action(ctx.t('term'), { method: 'PATCH', url, prompt: { message: ctx.t('paidUntilPrompt'), field: 'paidUntil', value: account.paidUntil ? new Date(account.paidUntil).toISOString().slice(0, 10) : '' } }),
                account.status === 'active' && action(ctx.t('suspend'), { method: 'POST', url: `${url}/suspend`, confirm: ctx.t('suspendConfirm', { login: account.login }) }),
                account.status === 'suspended' && action(ctx.t('resume'), { method: 'POST', url: `${url}/resume` }),
                removeAction(ctx.t('deleteKeep'), url, ctx.t('adminDeleteConfirm', { login: account.login }), { removeFromPanel: false }),
                removeAction(ctx.t('deleteWithPanel'), url, ctx.t('deleteFromPanelConfirm', { login: account.login }), { removeFromPanel: true }),
              ])] : [],
            },
          };
        }),
        ctx.t('noAccounts'),
        ctx.t('searchAccounts'),
      )], { flush: true, actions }),
    ];
  },
};
