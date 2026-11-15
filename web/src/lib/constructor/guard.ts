/** Перевірки доступу сторінки конструктора */
import { get } from 'svelte/store';
import { can, ensureAuth, safeNext, user } from '$lib/domain/auth';
import type { PageDefinition } from './types.js';

export type GuardResult =
  | { ok: true }
  | { ok: false; redirect: string };

/**
 * Перевірити доступ: сесія + (за потреби) рівень права.
 * `url` — поточна адреса: гість з захищеної сторінки йде на вхід з `?next=`, увійшовший з гостьової — туди / у кабінет.
 */
export async function guardAccess(page: Pick<PageDefinition, 'access' | 'permission'>, url?: URL): Promise<GuardResult> {
  if (page.access === 'public') return { ok: true };

  if (page.access === 'guest') {
    return (await ensureAuth()) ? { ok: false, redirect: safeNext(url?.searchParams.get('next')) } : { ok: true };
  }

  if (!(await ensureAuth())) {
    const next = url ? `${url.pathname}${url.search}` : '';
    return { ok: false, redirect: next && next !== '/' ? `/login?next=${encodeURIComponent(next)}` : '/login' };
  }

  if (page.permission && !can(get(user), ...page.permission)) {
    return { ok: false, redirect: '/app' };
  }

  return { ok: true };
}
