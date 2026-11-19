/**
 * Білінг для оплати послуг (хостинг): баланс, журнал операцій, поповнення заявками.
 * Поповнення: клієнт обирає спосіб (картка / банківський переказ) і суму → отримує реквізити з унікальним
 * призначенням платежу → адміністратор знаходить переказ і підтверджує → баланс зараховано.
 */
import type { Request } from 'express';
import { Op, type Transaction } from 'sequelize';
import { config } from '../../config/index.js';
import { track } from '../../flowaxy/activity/index.js';
import { sequelize } from '../../flowaxy/db/index.js';
import { use, type UserRef } from '../../flowaxy/services/index.js';
import { HttpError } from '../../shared/http/index.js';
import { formatAmount, parseAmount } from './money.js';
import { BalanceTransaction, BillingAccount, BillingSetting, BillingTopup, TOPUP_METHODS, type TopupMethod, type TransactionKind } from './models.js';

/* ---------- Рахунок і рух балансу ---------- */

function presentTransaction(row: BalanceTransaction, users?: Map<number, UserRef>) {
  return {
    id: row.id,
    amount: formatAmount(row.amountCents),
    balanceAfter: formatAmount(row.balanceAfterCents),
    kind: row.kind,
    note: row.note,
    createdAt: row.createdAt,
    ...(users?.has(row.userId) ? { user: { id: row.userId, email: users.get(row.userId)!.email } } : {}),
  };
}

/** Рахунок користувача; створюється при першому зверненні */
async function ensureAccount(userId: number, transaction?: Transaction, lock = false): Promise<BillingAccount> {
  const options = { transaction, ...(lock && transaction ? { lock: transaction.LOCK.UPDATE } : {}) };
  const found = await BillingAccount.findByPk(userId, options);
  if (found) return found;
  await BillingAccount.findOrCreate({ where: { userId }, defaults: { userId }, transaction });
  return (await BillingAccount.findByPk(userId, options))!;
}

/** Рух балансу в межах транзакції БД; від'ємний баланс не допускається */
async function move(account: BillingAccount, amountCents: number, kind: TransactionKind, note: string | null, actorId: number | null, transaction: Transaction): Promise<void> {
  const next = account.balanceCents + amountCents;
  if (next < 0) throw new HttpError(400, 'Недостатньо коштів на балансі');
  account.balanceCents = next;
  await account.save({ transaction });
  await BalanceTransaction.create({ userId: account.userId, amountCents, balanceAfterCents: next, kind, note, actorId }, { transaction });
}

/** Коротко для шапки кабінету: баланс і заявки, що чекають підтвердження */
export async function summary(userId: number) {
  const [account, pending] = await Promise.all([ensureAccount(userId), BillingTopup.count({ where: { userId, status: 'pending' } })]);
  return { balance: formatAmount(account.balanceCents), currency: config.currency, pendingTopups: pending };
}

/** Сторінка «Баланс»: баланс, способи поповнення, мої заявки, журнал операцій */
export async function details(userId: number) {
  const [head, settings, topups, transactions] = await Promise.all([
    summary(userId),
    readSettings(),
    BillingTopup.findAll({ where: { userId }, order: [['id', 'DESC']], limit: 20 }),
    BalanceTransaction.findAll({ where: { userId }, order: [['id', 'DESC']], limit: 50 }),
  ]);
  return {
    ...head,
    minTopup: formatAmount(settings.minCents),
    note: settings.values['topup.note'] || null,
    methods: methodsView(settings),
    topups: topups.map((row) => presentTopup(row, settings)),
    transactions: transactions.map((row) => presentTransaction(row)),
  };
}

/* ---------- Оплата послуг (порт wallet для плагінів: хостинг, …) ---------- */

export async function balanceCents(userId: number, transaction?: Transaction): Promise<number> {
  return (await ensureAccount(userId, transaction)).balanceCents;
}

/** Списати оплату послуги в транзакції БД викликача; недостатньо коштів → 402 */
export async function chargeService(userId: number, amountCents: number, note: string, transaction: Transaction): Promise<void> {
  if (!Number.isInteger(amountCents) || amountCents < 0) throw new Error('Сума списання — ціле число копійок ≥ 0');
  if (amountCents === 0) return;
  const account = await ensureAccount(userId, transaction, true);
  if (account.balanceCents < amountCents) throw new HttpError(402, 'Недостатньо коштів на балансі');
  await move(account, -amountCents, 'charge', note.slice(0, 255), null, transaction);
}

/** Повернути кошти за послугу (компенсація невдалої операції) */
export async function refundService(userId: number, amountCents: number, note: string, transaction: Transaction): Promise<void> {
  if (amountCents <= 0) return;
  const account = await ensureAccount(userId, transaction, true);
  await move(account, amountCents, 'refund', note.slice(0, 255), null, transaction);
}

/* ---------- Реквізити й налаштування ---------- */

/** Поля реквізитів за способами (ключі налаштувань) */
export const SETTING_FIELDS = {
  card: ['card.number', 'card.holder', 'card.bank'],
  bank: ['bank.recipient', 'bank.iban', 'bank.edrpou', 'bank.bank'],
} as const satisfies Record<TopupMethod, readonly string[]>;
const OTHER_FIELDS = ['topup.min', 'topup.note'] as const;
const ALL_FIELDS = [...SETTING_FIELDS.card, ...SETTING_FIELDS.bank, ...OTHER_FIELDS];

type Settings = { values: Record<string, string>; minCents: number };

async function readSettings(): Promise<Settings> {
  const rows = await BillingSetting.findAll();
  const values = Object.fromEntries(rows.map((row) => [row.key, row.value ?? '']));
  return { values, minCents: parseAmount(values['topup.min'] || '50') ?? 5000 };
}

/** Спосіб доступний, коли заповнено основне поле реквізитів (номер картки / IBAN) */
function methodReady(settings: Settings, method: TopupMethod): boolean {
  return Boolean(settings.values[method === 'card' ? 'card.number' : 'bank.iban']);
}

function methodsView(settings: Settings) {
  return TOPUP_METHODS.filter((method) => methodReady(settings, method)).map((method) => ({
    method,
    requisites: Object.fromEntries(SETTING_FIELDS[method].map((key) => [key.split('.')[1]!, settings.values[key] ?? ''])),
  }));
}

export async function adminSettings() {
  const settings = await readSettings();
  return { settings: Object.fromEntries(ALL_FIELDS.map((key) => [key, settings.values[key] ?? ''])) };
}

/** Перевірка реквізитів: картка — 16 цифр, IBAN — UA + 27 цифр, ЄДРПОУ / ІПН — 8–10 цифр */
function readSetting(key: string, raw: unknown): string {
  const value = String(raw ?? '').trim().slice(0, 255);
  if (!value) return '';
  if (key === 'card.number') {
    const digits = value.replace(/\D/g, '');
    if (!/^\d{16}$/.test(digits)) throw new HttpError(400, 'Номер картки: 16 цифр');
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  }
  if (key === 'bank.iban') {
    const iban = value.replace(/\s/g, '').toUpperCase();
    if (!/^UA\d{27}$/.test(iban)) throw new HttpError(400, 'IBAN: UA і 27 цифр');
    return iban;
  }
  if (key === 'bank.edrpou' && !/^\d{8,10}$/.test(value)) throw new HttpError(400, 'ЄДРПОУ / ІПН: 8–10 цифр');
  if (key === 'topup.min' && (parseAmount(value) ?? 0) <= 0) throw new HttpError(400, 'Мінімальна сума: число > 0');
  return value;
}

export async function updateSettings(req: Request, actorId: number, input: Record<string, unknown>) {
  const changes = ALL_FIELDS.filter((key) => input[key] !== undefined).map((key) => ({ key, value: readSetting(key, input[key]) || null }));
  for (const change of changes) await BillingSetting.upsert({ ...change, updatedAt: new Date() });
  await track(req, actorId, 'admin.billing_settings', { fields: changes.length });
  return adminSettings();
}

/* ---------- Заявки на поповнення ---------- */

function presentTopup(row: BillingTopup, settings?: Settings, users?: Map<number, UserRef>) {
  return {
    id: row.id,
    method: row.method,
    amount: formatAmount(row.amountCents),
    reference: row.reference,
    status: row.status,
    note: row.note,
    createdAt: row.createdAt,
    resolvedAt: row.resolvedAt,
    // Реквізити — лише поки заявка чекає оплати
    ...(settings && row.status === 'pending'
      ? { requisites: Object.fromEntries(SETTING_FIELDS[row.method].map((key) => [key.split('.')[1]!, settings.values[key] ?? ''])) }
      : {}),
    ...(users?.has(row.userId) ? { user: users.get(row.userId)! } : {}),
  };
}

/** Нова заявка: спосіб налаштований, сума ≥ мінімальної, не більше 3 відкритих заявок */
export async function createTopup(req: Request, userId: number, input: Record<string, unknown>) {
  const method = String(input.method ?? '') as TopupMethod;
  const settings = await readSettings();
  if (!TOPUP_METHODS.includes(method) || !methodReady(settings, method)) throw new HttpError(400, 'Цей спосіб поповнення недоступний');
  const amount = parseAmount(input.amount);
  if (amount === null || amount < settings.minCents) throw new HttpError(400, `Мінімальна сума поповнення — ${formatAmount(settings.minCents)} ${config.currency}`);
  if (amount > 100_000_00) throw new HttpError(400, 'Сума завелика — зверніться до підтримки');
  if (await BillingTopup.count({ where: { userId, status: 'pending' } }) >= 3) {
    throw new HttpError(429, 'У вас уже 3 заявки, що чекають оплати — оплатіть або скасуйте одну з них');
  }

  const topup = await sequelize.transaction(async (transaction) => {
    const row = await BillingTopup.create({ userId, method, amountCents: amount, reference: `pending-${Date.now()}-${userId}` }, { transaction });
    // Призначення платежу: коротке, унікальне, з номером користувача — за ним шукають переказ у виписці
    row.reference = `FX-${userId}-${String(row.id).padStart(5, '0')}`;
    await row.save({ transaction });
    return row;
  });
  await track(req, userId, 'balance.topup_requested', { amount: formatAmount(amount), currency: config.currency, method });
  return { topup: presentTopup(topup, settings) };
}

export async function cancelTopup(userId: number, id: number) {
  const topup = await BillingTopup.findOne({ where: { id, userId } });
  if (!topup) throw new HttpError(404, 'Заявку не знайдено');
  if (topup.status !== 'pending') throw new HttpError(400, 'Заявку вже оброблено');
  await topup.update({ status: 'cancelled', resolvedAt: new Date(), note: 'Скасовано клієнтом' });
}

/** Адміністратор: кошти надійшли → зарахувати (рядок заявки блокується від подвійного зарахування) */
export async function confirmTopup(req: Request, actorId: number, id: number) {
  const topup = await sequelize.transaction(async (transaction) => {
    const row = await BillingTopup.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!row) throw new HttpError(404, 'Заявку не знайдено');
    if (row.status !== 'pending') throw new HttpError(400, 'Заявку вже оброблено');
    const account = await ensureAccount(row.userId, transaction, true);
    const via = row.method === 'card' ? 'картка' : 'банківський переказ';
    await move(account, row.amountCents, 'topup', `Поповнення (${via}) ${row.reference}`, actorId, transaction);
    await row.update({ status: 'paid', resolvedAt: new Date(), actorId }, { transaction });
    return row;
  });
  await track(null, topup.userId, 'balance.changed', { amount: formatAmount(topup.amountCents), currency: config.currency });
  await track(req, actorId, 'admin.topup_confirmed', { userId: topup.userId, amount: formatAmount(topup.amountCents), reference: topup.reference });
  return { topup: presentTopup(topup) };
}

export async function rejectTopup(req: Request, actorId: number, id: number, reason: unknown) {
  const topup = await BillingTopup.findByPk(id);
  if (!topup) throw new HttpError(404, 'Заявку не знайдено');
  if (topup.status !== 'pending') throw new HttpError(400, 'Заявку вже оброблено');
  await topup.update({ status: 'cancelled', resolvedAt: new Date(), actorId, note: String(reason ?? '').trim().slice(0, 255) || 'Відхилено адміністратором' });
  await track(req, actorId, 'admin.topup_rejected', { userId: topup.userId, reference: topup.reference });
}

/* ---------- Адмінка ---------- */

export async function adminTopups(status?: string) {
  const where = status === 'paid' || status === 'cancelled' ? { status } : status === 'all' ? {} : { status: 'pending' };
  const rows = await BillingTopup.findAll({ where, order: [['id', 'DESC']], limit: 200 });
  const users = await use('users').byIds(rows.map((row) => row.userId));
  return { topups: rows.map((row) => presentTopup(row, undefined, users)) };
}

export async function adminOverview() {
  const transactions = await BalanceTransaction.findAll({ order: [['id', 'DESC']], limit: 100 });
  const users = await use('users').byIds(transactions.map((row) => row.userId));
  return { currency: config.currency, transactions: transactions.map((row) => presentTransaction(row, users)) };
}

/** Поповнення / коригування балансу користувача адміністратором */
export async function adjustBalance(req: Request, actorId: number, input: Record<string, unknown>) {
  const email = String(input.email ?? '').trim().toLowerCase();
  const amount = parseAmount(input.amount);
  const note = String(input.note ?? '').trim().slice(0, 255) || null;
  if (!amount) throw new HttpError(400, 'Сума: ненульове число, до 2 знаків після коми');

  const user = await use('users').byEmail(email);
  if (!user) throw new HttpError(404, 'Користувача не знайдено');

  await sequelize.transaction(async (transaction) => {
    const account = await ensureAccount(user.id, transaction, true);
    await move(account, amount, amount > 0 ? 'topup' : 'adjustment', note, actorId, transaction);
  });

  await track(null, user.id, 'balance.changed', { amount: formatAmount(amount), currency: config.currency });
  await track(req, actorId, 'admin.balance_adjusted', { userId: user.id, amount: formatAmount(amount) });
  return summary(user.id);
}

/** Кількість заявок, що чекають (показник адмінки) */
export async function pendingTopups() {
  const [count, sum] = await Promise.all([
    BillingTopup.count({ where: { status: 'pending' } }),
    BillingTopup.sum('amountCents', { where: { status: 'pending', amountCents: { [Op.gt]: 0 } } }),
  ]);
  return { count, amount: formatAmount(Number(sum ?? 0)) };
}
