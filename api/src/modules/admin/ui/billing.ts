/** Адмінка → Білінг: показники, тарифи, операції всіх користувачів; поповнення й новий тариф — у шапці */
import { fn, col, Op, type WhereOptions } from 'sequelize';
import { config } from '../../../config/index.js';
import type { Tone, UiButton, UiContext, UiNode, UiPage } from '../../../core/ui/index.js';
import { avatarUrl } from '../../auth/core/index.js';
import { User } from '../../auth/models/user.js';
import { formatAmount } from '../../billing/money.js';
import { BalanceTransaction, BillingAccount, Plan, type TransactionKind } from '../../billing/models.js';
import { act, gridState, likeOf, lines, pageOf, tx } from './kit.js';

const KINDS: TransactionKind[] = ['topup', 'charge', 'adjustment', 'refund'];
const KIND_TONE: Record<TransactionKind, Tone> = { topup: 'green', charge: 'orange', adjustment: 'slate', refund: 'blue' };

async function render(ctx: UiContext) {
  const grid = gridState(ctx.state, ['date', 'amount'], '-date');
  const query = (ctx.state.q ?? '').trim().slice(0, 100);
  const kind = KINDS.includes(ctx.state.kind as TransactionKind) ? (ctx.state.kind as TransactionKind) : null;
  const currency = config.currency;
  const money = (cents: number) => ({ type: 'money' as const, amount: formatAmount(cents), currency });
  const canManage = ctx.can('billing', 'manage');

  const where: WhereOptions<BalanceTransaction> = kind ? { kind } : {};
  const [plans, balance, accounts, { rows, count }] = await Promise.all([
    Plan.findAll({ order: [['sortOrder', 'ASC'], ['priceCents', 'ASC']] }),
    BillingAccount.sum('balanceCents'),
    BillingAccount.findAll({ attributes: ['planId', [fn('COUNT', col('userId')), 'total']], group: ['planId'], raw: true }) as unknown as Promise<
      Array<{ planId: number; total: number | string }>
    >,
    BalanceTransaction.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'email', 'name', 'avatar'],
        ...(query ? { where: { email: { [Op.like]: likeOf(query) } }, required: true } : {}),
      }],
      order: [[grid.sort.key === 'amount' ? 'amountCents' : 'id', grid.sort.dir === 'asc' ? 'ASC' : 'DESC']],
      limit: grid.perPage,
      offset: grid.offset,
    }),
  ]);
  const subscribers = new Map(accounts.map((row) => [row.planId, Number(row.total)]));

  /* ---------- Тарифи ---------- */

  function planActions(plan: Plan): UiButton[] {
    if (!canManage || plan.isDefault) return [];
    return [
      act(plan.isActive ? ctx.t('billing.deactivate') : ctx.t('billing.activate'), plan.isActive ? 'close' : 'check', {
        variant: 'ghost',
        action: { method: 'PATCH', url: `/admin/billing/plans/${plan.id}`, body: { isActive: !plan.isActive } },
      }),
      act(ctx.t('common.delete'), 'trash', {
        variant: 'danger',
        action: { method: 'DELETE', url: `/admin/billing/plans/${plan.id}`, confirm: ctx.t('billing.deletePlanConfirm', { plan: plan.name }) },
      }),
    ];
  }

  const plansGrid: UiNode = {
    type: 'datagrid',
    columns: [
      { key: 'plan', label: ctx.t('billing.plans') },
      { key: 'price', label: ctx.t('billing.price'), align: 'right' },
      { key: 'users', label: ctx.t('roles.usersShort'), align: 'right', width: '1%' },
      { key: 'status', label: ctx.t('billing.status') },
      { key: 'actions', label: '', align: 'right', width: '1%' },
    ],
    rows: plans.map((plan) => ({
      key: plan.id,
      tone: plan.isActive ? undefined : 'muted' as const,
      cells: {
        plan: lines(plan.name, [plan.slug, plan.description].filter(Boolean).join(' · ')),
        price: [{ type: 'text', text: plan.priceCents ? money(plan.priceCents) : ctx.t('billing.free'), bold: true }],
        users: [{ type: 'text', text: String(subscribers.get(plan.id) ?? 0) }],
        status: [
          ...(plan.isDefault ? [{ type: 'badge' as const, text: ctx.t('billing.default'), tone: 'blue' as const }] : []),
          { type: 'badge', text: plan.isActive ? ctx.t('billing.active') : ctx.t('billing.inactive'), tone: plan.isActive ? 'green' : 'slate' },
        ],
        actions: [{ type: 'actions', items: planActions(plan) }],
      },
    })),
  };

  /* ---------- Операції ---------- */

  const transactionsGrid: UiNode = {
    type: 'datagrid',
    toolbar: {
      segments: {
        name: 'kind',
        value: kind ?? '',
        items: [{ label: ctx.t('common.viewAll'), value: '' }, ...KINDS.map((item) => ({ label: tx(ctx, `billing.kind.${item}`, item), value: item }))],
      },
      search: { name: 'q', value: query, placeholder: ctx.t('activity.filter') },
    },
    columns: [
      { key: 'date', label: ctx.t('common.date'), sortable: true, width: '1%' },
      { key: 'user', label: ctx.t('users.user') },
      { key: 'operation', label: ctx.t('billing.operation') },
      { key: 'amount', label: ctx.t('billing.amount'), align: 'right', sortable: true },
      { key: 'after', label: ctx.t('billing.after'), align: 'right' },
    ],
    sort: grid.sort,
    rows: rows.map((row) => ({
      key: row.id,
      tone: row.amountCents < 0 && row.kind === 'adjustment' ? 'warn' as const : undefined,
      cells: {
        date: [{ type: 'text', text: { type: 'datetime', value: row.createdAt }, tone: 'muted' }],
        user: row.user
          ? [{ type: 'person', name: row.user.name?.trim() || row.user.email, caption: row.user.name?.trim() ? row.user.email : undefined, seed: row.user.email, src: avatarUrl(row.user.avatar) }]
          : [{ type: 'text', text: '—', tone: 'muted' }],
        operation: [
          { type: 'badge', text: tx(ctx, `billing.kind.${row.kind}`, row.kind), tone: KIND_TONE[row.kind] },
          ...(row.note ? [{ type: 'text' as const, text: row.note, tone: 'muted' as const, size: 'sm' as const }] : []),
        ],
        amount: [{ type: 'text', text: [row.amountCents > 0 ? '+' : '', money(row.amountCents)], tone: row.amountCents > 0 ? 'success' : 'body', bold: true }],
        after: [{ type: 'text', text: money(row.balanceAfterCents) }],
      },
    })),
    page: pageOf(ctx, grid, count),
    empty: query || kind ? ctx.t('admin.grid.nothing') : ctx.t('billing.noTransactions'),
  };

  const nodes: UiNode[] = [
    {
      type: 'stats',
      items: [
        { label: ctx.t('admin.billing.totalBalance'), value: money(Number(balance) || 0), icon: 'wallet', tone: 'green' },
        { label: ctx.t('billing.plans'), value: String(plans.length), hint: ctx.t('admin.billing.activePlans', { count: plans.filter((plan) => plan.isActive).length }), icon: 'layers', tone: 'blue' },
        { label: ctx.t('admin.billing.operations'), value: String(count), icon: 'list', tone: 'purple' },
      ],
    },
    { type: 'panel', title: ctx.t('billing.plans'), flush: true, children: [plansGrid] },
    { type: 'panel', title: ctx.t('billing.allTransactions'), children: [transactionsGrid] },
  ];

  const actions: UiButton[] = canManage
    ? [
        {
          type: 'button',
          label: ctx.t('admin.billing.newPlan'),
          icon: 'plus',
          variant: 'ghost',
          dialog: {
            title: ctx.t('admin.billing.newPlan'),
            nodes: [{
              type: 'form',
              layout: 'stack',
              fields: [
                { name: 'name', kind: 'text', label: ctx.t('roles.name'), required: true },
                { name: 'slug', kind: 'text', label: ctx.t('billing.planSlug'), required: true, placeholder: 'pro' },
                { name: 'price', kind: 'text', label: `${ctx.t('billing.price')}, ${currency}`, value: '0' },
                { name: 'description', kind: 'text', label: ctx.t('billing.description') },
              ],
              submit: { label: ctx.t('common.create'), action: { method: 'POST', url: '/admin/billing/plans', success: { notice: ctx.t('admin.billing.planCreated') } } },
            }],
          },
        },
        {
          type: 'button',
          label: ctx.t('admin.billing.adjust'),
          icon: 'wallet',
          dialog: {
            title: ctx.t('billing.adjustTitle'),
            nodes: [
              { type: 'text', text: ctx.t('billing.adjustHint'), tone: 'muted', size: 'sm' },
              {
                type: 'form',
                layout: 'stack',
                fields: [
                  { name: 'email', kind: 'email', label: ctx.t('auth.email'), required: true },
                  { name: 'amount', kind: 'text', label: ctx.t('billing.amountSigned'), required: true, placeholder: '100.00' },
                  { name: 'note', kind: 'text', label: ctx.t('billing.note') },
                ],
                submit: { label: ctx.t('common.apply'), action: { method: 'POST', url: '/admin/billing/adjust', success: { notice: ctx.t('billing.adjusted') } } },
              },
            ],
          },
        },
      ]
    : [];

  return { nodes, actions };
}

export const billingPage: UiPage = {
  path: '/admin/billing',
  section: 'admin',
  title: 'nav.billingAdmin',
  subtitle: 'billing.adminSubtitle',
  permission: ['billing', 'view'],
  render,
};
