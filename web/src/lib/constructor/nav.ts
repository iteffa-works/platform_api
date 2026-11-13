/** Навігація з урахуванням прав користувача (чисті функції, без реєстру) */
import { can } from '$lib/domain/auth';
import type { User } from '$lib/shared/types';
import type { NavItem } from './types.js';

export function allowedNav(items: NavItem[], user: User | null | undefined): NavItem[] {
  return items.filter((item) => !item.permission || can(user, ...item.permission));
}

/** Перший доступний пункт — точка входу в розділ (null, якщо доступу немає) */
export function entryOf(items: NavItem[], user: User | null | undefined): string | null {
  return allowedNav(items, user)[0]?.href ?? null;
}
