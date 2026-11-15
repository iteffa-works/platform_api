/** Подання даних хостингу для сторінок (рендер на сервері) */
import type { Inline, Language, Tone, UiContext } from '../../../core/ui/index.js';
import type { AccountView } from '../services/presenter.js';

export type { AccountView };

const DAY = 864e5;

/** Днів до дати (відʼємне — прострочено); null — без строку */
export function daysLeft(date: Date | string | null, now = Date.now()): number | null {
  return date ? Math.ceil((new Date(date).getTime() - now) / DAY) : null;
}

/** МБ → «8.53 GB» / «512 MB»; null → «—» */
export function formatSize(mb: number | null | undefined): string {
  if (mb === null || mb === undefined) return '—';
  return mb >= 1024 ? `${(mb / 1024).toFixed(2)} GB` : `${Math.round(mb)} MB`;
}

export function percent(used: number | null, limit: number | null): number | null {
  if (used === null || !limit) return null;
  return Math.min(100, Math.round((used / limit) * 100));
}

export function freeSize(used: number | null, limit: number | null): string {
  return used !== null && limit !== null ? formatSize(Math.max(0, limit - used)) : '—';
}

export function countryName(code: string | null | undefined, lang: Language): string {
  if (!code) return '—';
  try {
    return new Intl.DisplayNames([lang], { type: 'region' }).of(code) ?? code;
  } catch {
    return code;
  }
}

/** Працює / скоро закінчується / заблоковано / інше */
export function accountTone(account: AccountView): Tone {
  if (account.status === 'suspended') return 'red';
  if (account.status !== 'active') return 'slate';
  const days = daysLeft(account.paidUntil);
  return days !== null && days <= 7 ? 'orange' : 'green';
}

/** «Сплачений до 12.12.2026 (залишилось 26 дн.)» */
export function paidLabel(ctx: UiContext, account: AccountView): Inline {
  if (account.status === 'pending') return ctx.t('status.pending');
  if (!account.paidUntil) return ctx.t('noTerm');
  const days = daysLeft(account.paidUntil)!;
  const [before, after] = ctx.t(days >= 0 ? 'paidUntilLeft' : 'paidUntilOverdue', { date: '\u0000', days: Math.abs(days) }).split('\u0000');
  return [before ?? '', { type: 'date', value: account.paidUntil }, after ?? ''];
}
