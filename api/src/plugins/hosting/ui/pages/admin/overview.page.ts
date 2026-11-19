/**
 * /admin/hosting — огляд розділу: запуск хостингу (кроки, поки не виконані), показники,
 * сервери зі станом синхронізації, акаунти, що закінчуються (вибірка в SQL).
 */
import { config } from '../../../../../config/index.js';
import { person, ui, type UiContext, type UiNode, type UiPage } from '../../../../../flowaxy/ui/index.js';
import { hosting } from '../../../module.js';
import { money, type ServerView } from '../../../services/presenter.js';
import { countryName, daysLeft, percent } from '../../format.js';
import { datagrid } from '../../grid.js';
import { ADMIN, badge, panel, usageTone } from '../../kit.js';

type Step = { done: boolean; title: string; hint: string; href: string; action: string };

/** Кроки запуску: сервер → синхронізація → шаблони → тарифи → відкрито для замовлень */
async function launchSteps(ctx: UiContext, servers: ServerView[]): Promise<Step[]> {
  const [templates, plans] = await Promise.all([hosting.plans.templates(), hosting.plans.list(true)]);
  const active = servers.filter((server) => server.isActive);
  return [
    { done: active.length > 0, title: ctx.t('launch.server'), hint: ctx.t('launch.serverHint'), href: `${ADMIN}/servers`, action: ctx.t('addServer') },
    { done: active.some((server) => server.syncedAt && !server.syncError), title: ctx.t('launch.sync'), hint: ctx.t('launch.syncHint'), href: `${ADMIN}/servers`, action: ctx.t('section.servers') },
    { done: templates.size > 0, title: ctx.t('launch.templates'), hint: ctx.t('launch.templatesHint'), href: `${ADMIN}/plans`, action: ctx.t('syncTemplates') },
    { done: plans.length > 0, title: ctx.t('launch.plans'), hint: ctx.t('launch.plansHint'), href: `${ADMIN}/plans`, action: ctx.t('createPlan') },
    { done: plans.length > 0 && active.some((server) => server.isPublic), title: ctx.t('launch.orders'), hint: ctx.t('launch.ordersHint'), href: '/app/hosting/order', action: ctx.t('launch.openOrder') },
  ];
}

function launchPanel(ctx: UiContext, steps: Step[]): UiNode {
  const done = steps.filter((step) => step.done).length;
  const next = steps.findIndex((step) => !step.done);
  return panel(ctx.t('launch.title'), [
    { type: 'progress', value: Math.round((done / steps.length) * 100), tone: 'blue', label: ctx.t('launch.progress', { done, total: steps.length }) },
    ...steps.map((step, index): UiNode => ui.row([
      ui.row([
        { type: 'status', tone: step.done ? 'green' : index === next ? 'blue' : 'slate', icon: step.done ? 'check' : 'clock' },
        ui.stack([ui.text({ b: `${index + 1}. ${step.title}` }), ui.muted(step.hint)], 2),
      ]),
      ...(step.done ? [badge(ctx.t('launch.done'), 'green')] : [{ type: 'button' as const, variant: index === next ? 'primary' as const : 'ghost' as const, label: step.action, href: step.href }]),
    ], 'between')),
  ], { subtitle: ctx.t('launch.subtitle') });
}

/** Стан синхронізації сервера в клітинці */
function syncCell(ctx: UiContext, server: ServerView): UiNode[] {
  if (!server.isActive) return [badge(ctx.t('off'))];
  if (server.syncError) return [badge(ctx.t('syncFailed'), 'red'), ui.muted(server.syncError)];
  return server.syncedAt
    ? [badge(ctx.t('on'), 'green'), ui.text({ type: 'datetime', value: new Date(server.syncedAt).toISOString() }, { size: 'sm', tone: 'muted' })]
    : [badge(ctx.t('syncNever'), 'slate')];
}

export const overviewPage: UiPage = {
  path: ADMIN,
  section: 'admin',
  title: 'nav.overview',
  subtitle: 'overview.subtitle',
  permission: ['hosting', 'view'],
  async render(ctx) {
    const [stats, { servers, providers }, expiring] = await Promise.all([
      hosting.accounts.stats(),
      hosting.servers.list(),
      // Найближчі 10 строків: лише активні, сортування в SQL
      hosting.accounts.search({ status: 'active', sort: { key: 'paid', dir: 'asc' }, limit: 10, offset: 0 }),
    ]);
    const soon = expiring.accounts.filter((account) => {
      const days = daysLeft(account.paidUntil);
      return days !== null && days <= 7;
    });
    const providerTitle = (id: string) => providers.find((item) => item.id === id)?.title ?? id;
    const steps = await launchSteps(ctx, servers);

    const nodes: UiNode[] = [];
    if (steps.some((step) => !step.done)) nodes.push(launchPanel(ctx, steps));

    nodes.push({
      type: 'stats',
      items: [
        { label: ctx.t('stat.active'), value: String(stats.active), icon: 'server', tone: 'green', href: `${ADMIN}/accounts?status=active` },
        { label: ctx.t('stat.suspended'), value: String(stats.suspended), icon: 'lock', tone: stats.suspended ? 'orange' : 'slate', href: `${ADMIN}/accounts?status=suspended` },
        { label: ctx.t('stat.expiring'), value: String(stats.expiring), hint: ctx.t('stat.expiringHint'), icon: 'clock', tone: stats.expiring ? 'orange' : 'slate', href: `${ADMIN}/accounts?status=active&sort=paid` },
        { label: ctx.t('stat.revenue'), value: ui.money(money(stats.monthlyCents), config.currency), hint: ctx.t('stat.revenueHint'), icon: 'wallet', tone: 'blue' },
      ],
    });

    nodes.push({
      type: 'grid',
      min: 460,
      children: [
        panel(ctx.t('servers'), [datagrid({
          ctx,
          paged: false,
          columns: [
            { key: 'name', label: ctx.t('server') },
            { key: 'load', label: ctx.t('accounts'), width: '150px' },
            { key: 'sync', label: ctx.t('syncState') },
          ],
          rows: servers.slice(0, 10).map((server) => {
            const fill = percent(server.accounts, server.maxAccounts);
            return {
              key: server.id,
              tone: server.isActive ? (server.syncError ? 'warn' as const : undefined) : 'muted' as const,
              cells: {
                name: [
                  ui.row([{ type: 'flag', code: server.location, size: 16 }, { type: 'link', text: server.name, href: `${ADMIN}/servers/${server.id}` }]),
                  ui.muted(`${providerTitle(server.provider)} · ${countryName(server.location, ctx.lang)}`),
                ],
                load: server.maxAccounts
                  ? [{ type: 'progress', value: fill, tone: usageTone(fill), label: `${server.accounts} / ${server.maxAccounts}` }]
                  : [ui.text(String(server.accounts))],
                sync: syncCell(ctx, server),
              },
            };
          }),
          empty: ctx.t('noServers'),
        })], { flush: true, actions: [{ type: 'button', variant: 'ghost', label: ctx.t('allServers'), href: `${ADMIN}/servers` }] }),
        panel(ctx.t('expiringSoon'), [datagrid({
          ctx,
          paged: false,
          columns: [
            { key: 'login', label: ctx.t('col.name') },
            { key: 'user', label: ctx.t('user') },
            { key: 'paid', label: ctx.t('paidUntilField'), align: 'right' },
          ],
          rows: soon.map((account) => {
            const days = daysLeft(account.paidUntil)!;
            return {
              key: account.id,
              tone: days <= 3 ? 'danger' as const : 'warn' as const,
              cells: {
                login: [{ type: 'link', text: account.login, href: `${ADMIN}/accounts/${account.id}` }, ui.muted(account.plan?.name ?? '—')],
                user: account.user ? [person(account.user)] : [ui.muted('—')],
                paid: [ui.text(ui.date(account.paidUntil!)), badge(days >= 0 ? ctx.t('daysLeft', { days }) : ctx.t('overdue', { days: -days }), days <= 3 ? 'red' : 'orange')],
              },
            };
          }),
          empty: ctx.t('noExpiring'),
        })], { flush: true, actions: [{ type: 'button', variant: 'ghost', label: ctx.t('allAccounts'), href: `${ADMIN}/accounts?status=active&sort=paid` }] }),
      ],
    });

    return {
      nodes,
      actions: [{ type: 'button', variant: 'ghost', label: ctx.t('syncAll'), icon: 'refresh', disabled: !servers.some((server) => server.isActive), action: { method: 'POST', url: `${ADMIN}/sync`, success: { notice: ctx.t('syncedAll') } } }],
    };
  },
};
