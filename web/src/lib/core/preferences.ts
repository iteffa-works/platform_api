/**
 * Налаштування пристрою, що синхронізуються з акаунтом (тема, мова).
 * Поки користувач залогінений — зміни також зберігаються в user_preferences.
 */
import { api } from '$lib/core/api';

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

let accountBound = false;

/** Викликає auth: після завантаження акаунта — true, після виходу — false */
export function bindAccount(value: boolean): void {
  accountBound = value;
}

export function readDeviceCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const part = document.cookie.split('; ').find((item) => item.startsWith(`${name}=`));
  return part ? decodeURIComponent(part.slice(name.length + 1)) : null;
}

export function writeDeviceCookie(name: string, value: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

/** Зберегти в акаунт, якщо залогінений; помилку мережі не показуємо — вибір лишається на пристрої */
export async function saveToAccount(patch: Record<string, unknown>): Promise<void> {
  if (!accountBound) return;
  await api('/cabinet/preferences', { method: 'PATCH', body: patch }).catch(() => undefined);
}
