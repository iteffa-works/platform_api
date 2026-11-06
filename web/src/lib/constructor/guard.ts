/** Перевірки доступу сторінки конструктора */
import { get } from 'svelte/store';
import { ensureAuth, user } from '$lib/domain/auth';
import type { AccessLevel } from './types.js';

export type GuardResult =
  | { ok: true }
  | { ok: false; redirect: string };

/** Перевірити access сторінки */
export async function guardAccess(access: AccessLevel): Promise<GuardResult> {
  if (access === 'public') return { ok: true };

  const authed = await ensureAuth();
  if (!authed) return { ok: false, redirect: '/login' };

  if (access === 'admin' && get(user)?.role !== 'admin') {
    return { ok: false, redirect: '/app' };
  }

  return { ok: true };
}
