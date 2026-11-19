/**
 * Програма лояльності: рівень за сумою оплачених послуг (списання мінус повернення) за весь час.
 * Пороги — у копійках валюти платформи.
 */
import { fn, col } from 'sequelize';
import { config } from '../../config/index.js';
import { formatAmount } from './money.js';
import { BalanceTransaction } from './models.js';

export const LOYALTY_TIERS = [
  { key: 'base', fromCents: 0 },
  { key: 'bronze', fromCents: 1_000_00 },
  { key: 'silver', fromCents: 3_000_00 },
  { key: 'gold', fromCents: 10_000_00 },
  { key: 'platinum', fromCents: 30_000_00 },
] as const;
export type LoyaltyTier = (typeof LOYALTY_TIERS)[number]['key'];

/** Оплачено за послуги, копійок: списання (від'ємні) мінус повернення */
export async function spentCents(userId: number): Promise<number> {
  const rows = await BalanceTransaction.findAll({
    where: { userId, kind: ['charge', 'refund'] },
    attributes: ['kind', [fn('SUM', col('amountCents')), 'total']],
    group: ['kind'],
    raw: true,
  }) as unknown as Array<{ kind: string; total: string | number | null }>;
  const total = rows.reduce((sum, row) => sum + Number(row.total ?? 0), 0);
  return Math.max(0, -total);
}

export function tierOf(cents: number) {
  let index = 0;
  LOYALTY_TIERS.forEach((tier, i) => {
    if (cents >= tier.fromCents) index = i;
  });
  return index;
}

export async function loyalty(userId: number) {
  const spent = await spentCents(userId);
  const index = tierOf(spent);
  const next = LOYALTY_TIERS[index + 1];
  return {
    tier: LOYALTY_TIERS[index]!.key as LoyaltyTier,
    spent: formatAmount(spent),
    currency: config.currency,
    next: next ? { tier: next.key as LoyaltyTier, remaining: formatAmount(next.fromCents - spent) } : null,
    /** Прогрес до наступного рівня, 0–100 */
    progress: next ? Math.round(((spent - LOYALTY_TIERS[index]!.fromCents) / (next.fromCents - LOYALTY_TIERS[index]!.fromCents)) * 100) : 100,
    tiers: LOYALTY_TIERS.map((tier) => ({ tier: tier.key, from: formatAmount(tier.fromCents) })),
  };
}
