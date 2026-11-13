/** Перевірки доступу сторінки конструктора */
import { get } from 'svelte/store';
import { can, ensureAuth, user } from '$lib/domain/auth';
import type { PageDefinition } from './types.js';

export type GuardResult =
  | { ok: true }
  | { ok: false; redirect: string };

/** Перевірити доступ: сесія + (за потреби) рівень права */
export async function guardAccess(page: Pick<PageDefinition, 'access' | 'permission'>): Promise<GuardResult> {
  if (page.access === 'public') return { ok: true };

  if (!(await ensureAuth())) return { ok: false, redirect: '/login' };

  if (page.permission && !can(get(user), ...page.permission)) {
    return { ok: false, redirect: '/app' };
  }

  return { ok: true };
}
