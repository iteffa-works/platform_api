/**
 * Адмінка → Білінг: баланс клієнтів, заявки на поповнення (картка / банківський переказ) з підтвердженням,
 * операції балансу, реквізити. Ручне коригування — у шапці.
 */
import { Op, type WhereOptions } from 'sequelize';
import { config } from '../../../config/index.js';
import { use } from '../../../flowaxy/services/index.js';
import { act, gridQuery, pageInfo, person, type Tone, tx, type UiButton, type UiContext, type UiField, type UiNode, type UiPage } from '../../../flowaxy/ui/index.js';
import { formatAmount } from '../money.js';
import { BalanceTransaction, BillingAccount, BillingTopup, type TopupStatus, type TransactionKind } from '../models.js';
import { adminSettings, pendingTopups, SETTING_FIELDS } from '../service.js';

const KINDS: TransactionKind[] = ['topup', 'charge', 'adjustment', 'refund'];
const KIND_TONE: Record<TransactionKind, Tone> = { topup: 'green', charge: 'orange', adjustment: 'slate', refund: 'blue' };
const STATUS_TONE: Record<TopupStatus, Tone> = { pending: 'orange', paid: 'green', cancelled: 'slate' };
const TABS = ['topups', 'transactions', 'settings'] as const;
type Tab = (typeof TABS)[number];
const BASE = '/admin/billing';

const money = (cents: number) => ({ type: 'money' as const, amount: formatAmount(cents), currency: config.currency });

/** Заявки на поповнення: стан (сегменти), підтвердження / відхилення */
async function topupsTab(ctx: UiContext, manage: boolean): Promise<UiNode[]> {
  const grid = gridQuery(ctx.state, ['date', 'amount'], '-date');
  const status = (['pending', 'paid', 'cancelled', 'all'] as const).find((item) => item === ctx.state.status) ?? 'pending';
  const where: WhereOptions<BillingTopup> = status === 'all' ? {} : { status };
  const query = grid.q;
  const users = use('users');
  if (query) {
    const ids = await users.idsByEmailLike(query);
    Object.assign(where, { [Op.or]: [{ reference: { [Op.like]: `%${query}%` } }, { userId: { [Op.in]: ids } }] });
  }
  const [{ rows, count }, counts] = await Promise.all([
    BillingTopup.findAndCountAll({
      where,
      order: [[grid.sort.key === 'amount' ? 'amountCents' : 'id', grid.sort.dir === 'asc' ? 'ASC' : 'DESC']],
      limit: grid.perPage,
      offset: grid.offset,
    }),
    Promise.all((['pending', 'paid', 'cancelled'] as const).map((item) => BillingTopup.count({ where: { status: item } }))),
  ]);
  const people = await users.byIds(rows.map((row) => row.userId));

  return [{
    type: 'datagrid',
    toolbar: {
      segments: {
        name: 'status',
        value: status === 'pending' ? '' : status,
        items: [
          { label: ctx.t('billing.topup.pending'), value: '', count: counts[0] },
          { label: ctx.t('billing.topup.paid'), value: 'paid', count: counts[1] },
          { label: ctx.t('billing.topup.cancelled'), value: 'cancelled', count: counts[2] },
          { label: ctx.t('common.viewAll'), value: 'all' },
        ],
      },
      search: { name: 'q', value: query, placeholder: ctx.t('billing.topup.search') },
    },
    columns: [
      { key: 'date', label: ctx.t('common.date'), sortable: true, width: '1%' },
      { key: 'user', label: ctx.t('users.user') },
      { key: 'reference', label: ctx.t('billing.topup.reference') },
      { key: 'method', label: ctx.t('billing.topup.method') },
      { key: 'amount', label: ctx.t('billing.amount'), align: 'right', sortable: true },
      { key: 'status', label: ctx.t('billing.topup.status') },
      { key: 'actions', label: '', align: 'right', width: '1%' },
    ],
    sort: grid.sort,
    rows: rows.map((row) => ({
      key: row.id,
      tone: row.status === 'pending' ? 'warn' as const : row.status === 'cancelled' ? 'muted' as const : undefined,
      cells: {
        date: [{ type: 'text', text: { type: 'datetime', value: row.createdAt }, tone: 'muted' }],
        user: people.has(row.userId) ? [person(people.get(row.userId)!)] : [{ type: 'text', text: '—', tone: 'muted' }],
        reference: [{ type: 'code', text: row.reference }],
        method: [{ type: 'badge', text: ctx.t(`billing.method.${row.method}`), tone: row.method === 'card' ? 'blue' : 'purple' }],
        amount: [{ type: 'text', text: money(row.amountCents), bold: true }],
        status: [
          { type: 'badge', text: ctx.t(`billing.topup.${row.status}`), tone: STATUS_TONE[row.status as TopupStatus] },
          ...(row.note ? [{ type: 'text' as const, text: row.note, tone: 'muted' as const, size: 'sm' as const }] : []),
        ],
        actions: [{
          type: 'actions',
          items: manage && row.status === 'pending'
            ? [
              act(ctx.t('billing.topup.confirm'), 'check', {
                variant: 'primary',
                action: { method: 'POST', url: `${BASE}/topups/${row.id}/confirm`, confirm: ctx.t('billing.topup.confirmAsk', { amount: `${formatAmount(row.amountCents)} ${config.currency}`, reference: row.reference }), success: { notice: ctx.t('billing.topup.confirmed') } },
              }),
              act(ctx.t('billing.topup.reject'), 'close', {
                variant: 'danger',
                action: { method: 'POST', url: `${BASE}/topups/${row.id}/reject`, prompt: { message: ctx.t('billing.topup.rejectReason'), field: 'reason' } },
              }),
            ]
            : [],
        }],
      },
    })),
    page: pageInfo(ctx, grid, count),
    empty: query ? ctx.t('admin.grid.nothing') : ctx.t('billing.topup.empty'),
  }];
}

/** Операції балансу всіх клієнтів */
async function transactionsTab(ctx: UiContext): Promise<UiNode[]> {
  const grid = gridQuery(ctx.state, ['date', 'amount'], '-date');
  const kind = KINDS.includes(ctx.state.kind as TransactionKind) ? (ctx.state.kind as TransactionKind) : null;
  const users = use('users');
  const where: WhereOptions<BalanceTransaction> = kind ? { kind } : {};
  if (grid.q) Object.assign(where, { userId: { [Op.in]: await users.idsByEmailLike(grid.q) } });
  const { rows, count } = await BalanceTransaction.findAndCountAll({
    where,
    order: [[grid.sort.key === 'amount' ? 'amountCents' : 'id', grid.sort.dir === 'asc' ? 'ASC' : 'DESC']],
    limit: grid.perPage,
    offset: grid.offset,
  });
  const people = await users.byIds(rows.map((row) => row.userId));

  return [{
    type: 'datagrid',
    toolbar: {
      segments: {
        name: 'kind',
        value: kind ?? '',
        items: [{ label: ctx.t('common.viewAll'), value: '' }, ...KINDS.map((item) => ({ label: tx(ctx, `billing.kind.${item}`, item), value: item }))],
      },
      search: { name: 'q', value: grid.q, placeholder: ctx.t('activity.filter') },
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
        user: people.has(row.userId) ? [person(people.get(row.userId)!)] : [{ type: 'text', text: '—', tone: 'muted' }],
        operation: [
          { type: 'badge', text: tx(ctx, `billing.kind.${row.kind}`, row.kind), tone: KIND_TONE[row.kind] },
          ...(row.note ? [{ type: 'text' as const, text: row.note, tone: 'muted' as const, size: 'sm' as const }] : []),
        ],
        amount: [{ type: 'text', text: [row.amountCents > 0 ? '+' : '', money(row.amountCents)], tone: row.amountCents > 0 ? 'success' : 'body', bold: true }],
        after: [{ type: 'text', text: money(row.balanceAfterCents) }],
      },
    })),
    page: pageInfo(ctx, grid, count),
    empty: grid.q || kind ? ctx.t('admin.grid.nothing') : ctx.t('billing.noTransactions'),
  }];
}

/** Реквізити: картка, банківський переказ, мінімальна сума */
async function settingsTab(ctx: UiContext, manage: boolean): Promise<UiNode[]> {
  const { settings } = await adminSettings();
  const field = (key: string, extra: Partial<UiField> = {}): UiField => ({ name: key, kind: 'text', label: ctx.t(`billing.setting.${key}`), value: settings[key] ?? '', autocomplete: 'off', grow: true, ...extra });
  const section = (title: string, hint: string, fields: UiField[]): UiNode => ({
    type: 'panel',
    title,
    subtitle: hint,
    children: [{
      type: 'form',
      layout: 'stack',
      fields: manage ? fields : fields.map((item) => ({ ...item, kind: 'hidden' as const })),
      ...(manage ? { submit: { label: ctx.t('common.save'), action: { method: 'PATCH' as const, url: `${BASE}/settings`, success: { notice: ctx.t('billing.setting.saved') } } } } : {}),
    }],
  });
  return [{
    type: 'grid',
    min: 340,
    children: [
      section(ctx.t('billing.method.card'), ctx.t('billing.setting.cardHint'), SETTING_FIELDS.card.map((key) => field(key, key === 'card.number' ? { placeholder: '0000 0000 0000 0000' } : {}))),
      section(ctx.t('billing.method.bank'), ctx.t('billing.setting.bankHint'), SETTING_FIELDS.bank.map((key) => field(key, key === 'bank.iban' ? { placeholder: 'UA00 0000 0000 0000 0000 0000 0000 0' } : {}))),
      section(ctx.t('billing.setting.general'), ctx.t('billing.setting.generalHint'), [
        field('topup.min', { kind: 'number', placeholder: '50' }),
        field('topup.note'),
      ]),
    ],
  }];
}

async function render(ctx: UiContext) {
  const manage = ctx.can('billing', 'manage');
  const tab: Tab = (TABS as readonly string[]).includes(ctx.state.tab ?? '') ? ctx.state.tab as Tab : 'topups';
  const [balance, pending, operations] = await Promise.all([BillingAccount.sum('balanceCents'), pendingTopups(), BalanceTransaction.count()]);

  const nodes: UiNode[] = [
    {
      type: 'stats',
      items: [
        { label: ctx.t('billing.topup.waiting'), value: String(pending.count), hint: ctx.t('billing.topup.waitingSum', { amount: `${pending.amount} ${config.currency}` }), icon: 'clock', tone: pending.count ? 'orange' : 'slate', href: BASE },
        { label: ctx.t('admin.billing.totalBalance'), value: money(Number(balance) || 0), icon: 'wallet', tone: 'green' },
        { label: ctx.t('admin.billing.operations'), value: String(operations), icon: 'list', tone: 'purple', href: `${BASE}?tab=transactions` },
      ],
    },
    {
      type: 'tabs',
      variant: 'pills',
      items: TABS.map((item) => ({ label: ctx.t(`billing.tab.${item}`), href: item === 'topups' ? BASE : `${BASE}?tab=${item}`, active: item === tab, ...(item === 'topups' ? { count: pending.count } : {}) })),
    },
    ...(tab === 'topups' ? await topupsTab(ctx, manage) : tab === 'transactions' ? await transactionsTab(ctx) : await settingsTab(ctx, manage)),
  ];

  const actions: UiButton[] = manage
    ? [{
      type: 'button',
      label: ctx.t('admin.billing.adjust'),
      icon: 'wallet',
      variant: 'ghost',
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
            submit: { label: ctx.t('common.apply'), action: { method: 'POST', url: `${BASE}/adjust`, success: { notice: ctx.t('billing.adjusted') } } },
          },
        ],
      },
    }]
    : [];

  return { nodes, actions };
}

export const billingPage: UiPage = {
  path: BASE,
  section: 'admin',
  title: 'nav.billingAdmin',
  subtitle: 'billing.adminSubtitle',
  permission: ['billing', 'view'],
  render,
};
