import type { Request } from 'express';
import { type Transaction } from 'sequelize';
import { track } from '../../core/activity/index.js';
import { sequelize } from '../../core/db/index.js';
import { config } from '../../config/index.js';
import { HttpError } from '../../shared/http/index.js';
import { User } from '../auth/models/user.js';
import { formatAmount, parseAmount } from './money.js';
import { BalanceTransaction, BillingAccount, Plan, type TransactionKind } from './models.js';

function presentPlan(plan: Plan) {
  return {
    id: plan.id,
    slug: plan.slug,
    name: plan.name,
    description: plan.description,
    price: formatAmount(plan.priceCents),
    isDefault: plan.isDefault,
    isActive: plan.isActive,
    sortOrder: plan.sortOrder,
  };
}

function presentTransaction(row: BalanceTransaction) {
  return {
    id: row.id,
    amount: formatAmount(row.amountCents),
    balanceAfter: formatAmount(row.balanceAfterCents),
    kind: row.kind,
    note: row.note,
    createdAt: row.createdAt,
    ...(row.user ? { user: { id: row.user.id, email: row.user.email } } : {}),
  };
}

async function defaultPlan(transaction?: Transaction): Promise<Plan> {
  const plan = await Plan.findOne({ where: { isDefault: true }, transaction });
  if (!plan) throw new Error('Немає тарифу за замовчуванням — виконайте міграції');
  return plan;
}

/** Рахунок користувача; створюється з тарифом за замовчуванням при першому зверненні */
async function ensureAccount(userId: number, transaction?: Transaction, lock = false): Promise<BillingAccount> {
  const options = { transaction, ...(lock && transaction ? { lock: transaction.LOCK.UPDATE } : {}) };
  const found = await BillingAccount.findByPk(userId, options);
  if (found) return found;
  const plan = await defaultPlan(transaction);
  await BillingAccount.findOrCreate({ where: { userId }, defaults: { userId, planId: plan.id }, transaction });
  return (await BillingAccount.findByPk(userId, options))!;
}

/** Рух балансу в межах транзакції БД; від'ємний баланс не допускається */
async function move(
  account: BillingAccount,
  amountCents: number,
  kind: TransactionKind,
  note: string | null,
  actorId: number | null,
  transaction: Transaction,
): Promise<void> {
  const next = account.balanceCents + amountCents;
  if (next < 0) throw new HttpError(400, 'Недостатньо коштів на балансі');
  account.balanceCents = next;
  await account.save({ transaction });
  await BalanceTransaction.create({
    userId: account.userId, amountCents, balanceAfterCents: next, kind, note, actorId,
  }, { transaction });
}

/** Коротко для шапки кабінету */
export async function summary(userId: number) {
  const account = await ensureAccount(userId);
  const plan = await Plan.findByPk(account.planId);
  return { balance: formatAmount(account.balanceCents), currency: config.currency, plan: plan ? presentPlan(plan) : null };
}

/** Сторінка «Тариф і баланс» */
export async function details(userId: number) {
  const [head, plans, transactions] = await Promise.all([
    summary(userId),
    Plan.findAll({ where: { isActive: true }, order: [['sortOrder', 'ASC'], ['priceCents', 'ASC']] }),
    BalanceTransaction.findAll({ where: { userId }, order: [['id', 'DESC']], limit: 50 }),
  ]);
  return { ...head, plans: plans.map(presentPlan), transactions: transactions.map(presentTransaction) };
}

/** Зміна тарифу: платний — разове списання ціни з балансу */
export async function changePlan(req: Request, userId: number, planId: unknown) {
  const plan = await Plan.findByPk(Number(planId));
  if (!plan || !plan.isActive) throw new HttpError(404, 'Тариф не знайдено');

  await sequelize.transaction(async (transaction) => {
    const account = await ensureAccount(userId, transaction, true);
    if (account.planId === plan.id) throw new HttpError(400, 'Цей тариф уже активний');
    if (plan.priceCents > 0) await move(account, -plan.priceCents, 'charge', `Тариф ${plan.name}`, null, transaction);
    account.planId = plan.id;
    await account.save({ transaction });
  });

  await track(req, userId, 'plan.changed', { plan: plan.name });
  return summary(userId);
}

/* ---------- Оплата послуг (для інших модулів: хостинг, …) ---------- */

/** Баланс користувача в копійках */
export async function balanceCents(userId: number, transaction?: Transaction): Promise<number> {
  return (await ensureAccount(userId, transaction)).balanceCents;
}

/**
 * Списати оплату послуги в транзакції БД викликача (рядок рахунку блокується).
 * Недостатньо коштів → 402; разом з рештою транзакції відкочується.
 */
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

/* ---------- Адмінка ---------- */

export async function adminOverview() {
  const [plans, transactions] = await Promise.all([
    Plan.findAll({ order: [['sortOrder', 'ASC'], ['priceCents', 'ASC']] }),
    BalanceTransaction.findAll({
      order: [['id', 'DESC']],
      limit: 100,
      include: [{ model: User, as: 'user', attributes: ['id', 'email'] }],
    }),
  ]);
  return { currency: config.currency, plans: plans.map(presentPlan), transactions: transactions.map(presentTransaction) };
}

/** Поповнення / коригування балансу користувача адміністратором */
export async function adjustBalance(req: Request, actorId: number, input: Record<string, unknown>) {
  const email = String(input.email ?? '').trim().toLowerCase();
  const amount = parseAmount(input.amount);
  const note = String(input.note ?? '').trim().slice(0, 255) || null;
  if (!amount) throw new HttpError(400, 'Сума: ненульове число, до 2 знаків після коми');

  const user = await User.findOne({ where: { email }, attributes: ['id'] });
  if (!user) throw new HttpError(404, 'Користувача не знайдено');

  await sequelize.transaction(async (transaction) => {
    const account = await ensureAccount(user.id, transaction, true);
    await move(account, amount, amount > 0 ? 'topup' : 'adjustment', note, actorId, transaction);
  });

  await track(null, user.id, 'balance.changed', { amount: formatAmount(amount), currency: config.currency });
  await track(req, actorId, 'admin.balance_adjusted', { userId: user.id, amount: formatAmount(amount) });
  return summary(user.id);
}

type PlanInput = { slug?: string; name?: string; description?: string | null; priceCents?: number; isActive?: boolean; sortOrder?: number };

function readPlan(input: Record<string, unknown>, partial: boolean): PlanInput {
  const plan: PlanInput = {};
  if (!partial || input.slug !== undefined) {
    const slug = String(input.slug ?? '').trim();
    if (!/^[a-z][a-z0-9-]{1,31}$/.test(slug)) throw new HttpError(400, 'Ключ тарифу: 2–32 символи, латиниця, цифри, дефіс');
    plan.slug = slug;
  }
  if (!partial || input.name !== undefined) {
    const name = String(input.name ?? '').trim();
    if (!name || name.length > 80) throw new HttpError(400, 'Назва тарифу: 1–80 символів');
    plan.name = name;
  }
  if (input.description !== undefined) plan.description = String(input.description ?? '').trim().slice(0, 255) || null;
  if (!partial || input.price !== undefined) {
    const cents = parseAmount(input.price);
    if (cents === null || cents < 0) throw new HttpError(400, 'Ціна: число ≥ 0, до 2 знаків після коми');
    plan.priceCents = cents;
  }
  if (input.isActive !== undefined) plan.isActive = Boolean(input.isActive);
  if (input.sortOrder !== undefined) plan.sortOrder = Math.trunc(Number(input.sortOrder)) || 0;
  return plan;
}

export async function createPlan(input: Record<string, unknown>) {
  const data = readPlan(input, false);
  if (await Plan.findOne({ where: { slug: data.slug } })) throw new HttpError(409, 'Тариф з таким ключем уже існує');
  return { plan: presentPlan(await Plan.create(data as Required<Pick<PlanInput, 'slug' | 'name'>> & PlanInput)) };
}

export async function updatePlan(id: number, input: Record<string, unknown>) {
  const plan = await Plan.findByPk(id);
  if (!plan) throw new HttpError(404, 'Тариф не знайдено');
  const data = readPlan(input, true);
  if (plan.isDefault && data.isActive === false) throw new HttpError(400, 'Тариф за замовчуванням не можна вимкнути');
  if (data.slug && data.slug !== plan.slug && await Plan.findOne({ where: { slug: data.slug } })) {
    throw new HttpError(409, 'Тариф з таким ключем уже існує');
  }
  await plan.update(data);
  return { plan: presentPlan(plan) };
}

export async function deletePlan(id: number) {
  const plan = await Plan.findByPk(id);
  if (!plan) throw new HttpError(404, 'Тариф не знайдено');
  if (plan.isDefault) throw new HttpError(400, 'Тариф за замовчуванням не видаляється');
  if (await BillingAccount.count({ where: { planId: id } })) {
    throw new HttpError(400, 'Тариф використовується — вимкніть його замість видалення');
  }
  await plan.destroy();
}
