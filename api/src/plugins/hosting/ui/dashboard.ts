/**
 * Внесок хостингу в головну кабінету (`ui.dashboard`, area: cabinet): попередження про строк і блокування,
 * панель «Мій хостинг» (акаунти з діями, «Замовити») або пропозиція; праворуч — «Наступні платежі»
 * (найближчі продовження, сума за місяць і на скільки вистачить балансу — порт wallet).
 */
import { config } from '../../../config/index.js';
import { hooks } from '../../../flowaxy/hooks/index.js';
import { isEnabled } from '../../../flowaxy/plugins/index.js';
import { available, use } from '../../../flowaxy/services/index.js';
import { ui, withMessages, type DashboardSection, type UiContext, type UiNode } from '../../../flowaxy/ui/index.js';
import { hosting } from '../module.js';
import { accountTone, daysLeft, formatSize, percent, type AccountView } from './format.js';
import { datagrid } from './grid.js';
import { badge, usageTone } from './kit.js';
import { messages } from './messages/index.js';

const C = '/cabinet/hosting';

function accountsPanel(ctx: UiContext, accounts: AccountView[]): UiNode {
  return {
    type: 'panel',
    title: ctx.t('dash.myHosting'),
    flush: true,
    actions: [
      { type: 'button', variant: 'ghost', label: ctx.t('dash.all'), href: '/app/hosting' },
      { type: 'button', icon: 'plus', label: ctx.t('dash.order'), href: '/app/hosting/order' },
    ],
    children: [datagrid({
      ctx,
      paged: false,
      columns: [
        { key: 'name', label: ctx.t('col.name') },
        { key: 'paid', label: ctx.t('paidUntilField') },
        { key: 'disk', label: ctx.t('col.disk'), width: '170px' },
        { key: 'actions', label: '', align: 'right', width: '1%' },
      ],
      rows: accounts.map((account) => {
        const days = daysLeft(account.paidUntil);
        const fill = percent(account.usage.diskUsedMb, account.usage.diskLimitMb);
        const canRenew = Boolean(account.plan) && (account.status === 'active' || account.suspendReason === 'billing');
        return {
          key: account.id,
          tone: account.status === 'suspended' ? 'danger' as const : days !== null && days <= 7 ? 'warn' as const : undefined,
          cells: {
            name: [
              ui.row([{ type: 'status', tone: accountTone(account), icon: 'server' }, ui.stack([
                { type: 'link', text: account.login, href: `/app/hosting/${account.id}` },
                ui.muted(`${account.plan?.name ?? account.package ?? '—'}${account.note ? ` · ${account.note}` : ''}`),
              ], 0)]),
            ],
            paid: account.status === 'suspended'
              ? [badge(ctx.t('status.suspended'), 'red')]
              : account.paidUntil
                ? [ui.text(ui.date(account.paidUntil), { size: 'sm' }), ...(days !== null ? [badge(days >= 0 ? ctx.t('daysLeft', { days }) : ctx.t('overdue', { days: -days }), days <= 7 ? 'orange' : 'green')] : [])]
                : [ui.muted(ctx.t('noTerm'))],
            disk: [{ type: 'progress', value: fill, tone: usageTone(fill), label: `${formatSize(account.usage.diskUsedMb)} / ${formatSize(account.usage.diskLimitMb)}` }],
            actions: [{
              type: 'actions',
              items: [
                ...(canRenew ? [{ type: 'button' as const, label: ctx.t('renew'), icon: 'wallet', variant: 'ghost' as const, href: `/app/hosting/${account.id}?panel=renew` }] : []),
                ...(account.status === 'active' ? [{
                  type: 'button' as const,
                  label: ctx.t('openPanel'),
                  icon: 'external',
                  action: { method: 'POST' as const, url: `${C}/${account.id}/login`, openUrl: 'url', success: { reload: false } },
                }] : []),
              ],
            }],
          },
        };
      }),
      empty: ctx.t('empty'),
    })],
  };
}

/** Немає хостингу: пропозиція з найнижчою ціною й кнопкою вибору тарифу */
function offerPanel(ctx: UiContext, from: string | null): UiNode {
  return {
    type: 'panel',
    title: ctx.t('dash.myHosting'),
    children: [
      ui.row([
        ui.row([
          { type: 'status', tone: 'blue', icon: 'server' },
          ui.stack([
            ui.text({ b: ctx.t('dash.emptyTitle') }),
            ui.muted(from ? ctx.t('dash.emptyFrom', { price: `${from} ${config.currency}` }) : ctx.t('dash.emptyText')),
          ], 2),
        ]),
        { type: 'button', icon: 'plus', label: ctx.t('dash.choosePlan'), href: '/app/hosting/order' },
      ], 'between'),
    ],
  };
}

/** Наступні платежі: найближчі продовження, сума на місяць, покриття балансом */
function paymentsPanel(ctx: UiContext, accounts: AccountView[], balanceCents: number | null): UiNode | null {
  const billable = accounts
    .filter((account) => account.status === 'active' && account.plan && account.paidUntil && Number(account.plan.price) > 0)
    .sort((left, right) => new Date(left.paidUntil!).getTime() - new Date(right.paidUntil!).getTime());
  if (!billable.length) return null;
  const monthlyCents = billable.reduce((sum, account) => sum + Math.round(Number(account.plan!.price) * 100), 0);
  const money = (cents: number) => ({ type: 'money' as const, amount: (cents / 100).toFixed(2), currency: config.currency });
  const next = billable[0]!;
  const nextCents = Math.round(Number(next.plan!.price) * 100);

  const coverage: UiNode | null = balanceCents === null
    ? null
    : balanceCents < nextCents
      ? { type: 'alert', tone: 'warn', text: ctx.t('dash.payLow', { login: next.login }), action: { type: 'button', variant: 'ghost', label: ctx.t('dash.topup'), href: '/app/billing' } }
      : ui.muted(ctx.t('dash.payCovers', { months: Math.floor(balanceCents / monthlyCents) }));

  return {
    type: 'panel',
    title: ctx.t('dash.payments'),
    children: [
      ...billable.slice(0, 4).map((account): UiNode => {
        const days = daysLeft(account.paidUntil)!;
        return ui.row([
          ui.stack([
            ui.text({ b: account.login }, { size: 'sm' }),
            ui.text([ui.date(account.paidUntil!), ` · ${days >= 0 ? ctx.t('daysLeft', { days }) : ctx.t('overdue', { days: -days })}`], { size: 'sm', tone: days <= 7 ? 'warn' : 'muted' }),
          ], 0),
          ui.text([ui.money(account.plan!.price, config.currency), ` ${ctx.t('perMonth')}`], { size: 'sm', bold: true }),
        ], 'between');
      }),
      ui.row([ui.text(ctx.t('dash.payMonthly'), { size: 'sm', tone: 'muted' }), ui.text(money(monthlyCents), { bold: true })], 'between'),
      ...(coverage ? [coverage] : []),
    ],
  };
}

export function registerHostingDashboard(): void {
  hooks.addFilter('ui.dashboard', async (sections, { ctx: base, area }): Promise<DashboardSection[]> => {
    if (area !== 'cabinet') return sections;
    const ctx = withMessages(base, messages);
    const [{ accounts }, plans, balance] = await Promise.all([
      hosting.accounts.listMine(ctx.userId),
      hosting.plans.list(true),
      available('wallet') ? use('wallet').balance(ctx.userId).catch(() => null) : Promise.resolve(null),
    ]);
    const live = accounts.filter((account) => account.status !== 'deleted');
    const cheapest = plans.filter((plan) => Number(plan.price) > 0).sort((left, right) => Number(left.price) - Number(right.price))[0];

    const alerts: UiNode[] = [
      ...live.filter((account) => account.status === 'suspended').map((account): UiNode => ({
        type: 'alert',
        tone: 'danger',
        text: account.suspendReason === 'billing' ? ctx.t('dash.suspended', { login: account.login }) : ctx.t('dash.suspendedAdmin', { login: account.login }),
        action: account.suspendReason === 'billing' ? { type: 'button', label: ctx.t('renew'), href: `/app/hosting/${account.id}?panel=renew` } : undefined,
      })),
      ...live.filter((account) => {
        const days = daysLeft(account.paidUntil);
        return account.status === 'active' && days !== null && days <= 7;
      }).map((account): UiNode => {
        const days = daysLeft(account.paidUntil)!;
        return {
          type: 'alert',
          tone: 'warn',
          text: days >= 0 ? ctx.t('dash.expiring', { login: account.login, days }) : ctx.t('dash.overdue', { login: account.login }),
          action: { type: 'button', label: ctx.t('renew'), href: `/app/hosting/${account.id}?panel=renew` },
        };
      }),
    ];

    const payments = paymentsPanel(ctx, live, balance);
    return [...sections, {
      order: 10,
      alerts,
      panels: [live.length ? accountsPanel(ctx, live) : offerPanel(ctx, cheapest?.price ?? null)],
      aside: payments ? [payments] : [],
    }];
  }, { owner: 'hosting', when: () => isEnabled('hosting') });
}
