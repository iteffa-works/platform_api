import { goto, invalidateAll } from '$app/navigation';
import { derived, writable } from 'svelte/store';
import { bindAccount } from '$lib/core/preferences';
import { applyAccountTheme } from '$lib/domain/theme';
import { applyAccountLocale } from '$lib/i18n';
import type { User } from '$lib/shared/types';
import { timeZone } from '$lib/shared/utils';
import { fetchMe, fetchSession, postLogout } from './api.js';

/**
 * Сесія — httpOnly-cookie (сервер); тут лише завантажений користувач.
 * Модульний store: захищені сторінки рендеряться в браузері, тож він не ділиться між запитами SSR.
 */
export const user = writable<User | null>(null);
export const isAuthenticated = derived(user, ($user) => Boolean($user));

/* ---------- Синхронізація вкладок ---------- */

/** Канал між вкладками одного браузера: вхід / вихід / зміна акаунта */
const channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel('auth');
let knownId: number | null | undefined;

/** Змінився акаунт (вхід, вихід, інший користувач) — повідомити інші вкладки */
function announce(id: number | null): void {
  if (knownId !== undefined && knownId !== id) channel?.postMessage({ type: 'changed', id });
  knownId = id;
}

/**
 * Безпечна адреса повернення після входу: лише шлях цього застосунку (не `//host`, не гостьові сторінки).
 */
export function safeNext(next: string | null | undefined): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\') || /^\/(login|register)(\/|\?|$)/.test(next)) return '/app';
  return next;
}

let watching = false;
let lastCheck = 0;

/**
 * Стежити за сесією: інша вкладка увійшла / вийшла (BroadcastChannel) або вкладка повернулась у фокус
 * (сесію могли відкликати з іншого пристрою, вийшов строк). Зміна → перезапуск load поточної сторінки:
 * охоронець сторінки сам переведе на вхід або в кабінет.
 */
export function watchSession(): void {
  if (watching || typeof window === 'undefined') return;
  watching = true;

  const recheck = async () => {
    lastCheck = Date.now();
    const before = knownId;
    const current = await restoreSession();
    if ((current?.id ?? null) !== (before ?? null)) await invalidateAll();
  };

  channel?.addEventListener('message', () => void recheck());
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && Date.now() - lastCheck > 15_000) void recheck();
  });
}

/** Застосувати акаунт: користувач + його тема, мова, пояс */
export function acceptUser(value: User): void {
  user.set(value);
  announce(value.id);
  bindAccount(true);
  applyAccountTheme(value.preferences.theme);
  applyAccountLocale(value.preferences.language);
  timeZone.set(value.preferences.timezone ?? undefined);
}

function clearUser(): void {
  user.set(null);
  announce(null);
  bindAccount(false);
}

/** Імʼя для показу: імʼя з профілю або частина email до @ */
export function displayName(value: User | null | undefined): string {
  return value?.name || value?.email.split('@')[0] || '';
}

export async function loadMe(): Promise<User> {
  const data = await fetchMe();
  acceptUser(data.user);
  return data.user;
}

/** Підхопити сесію з cookie; null — гість */
export async function restoreSession(): Promise<User | null> {
  try {
    const data = await fetchSession();
    if (data.user) acceptUser(data.user);
    else clearUser();
    return data.user;
  } catch {
    clearUser();
    return null;
  }
}

export async function ensureAuth(): Promise<boolean> {
  return Boolean(await restoreSession());
}

/** Вихід: сервер відкликає сесію й очищає cookie */
export async function logout(): Promise<void> {
  await postLogout().catch(() => undefined);
  clearUser();
}

/** Вихід з переходом на сторінку входу */
export async function signOut(): Promise<void> {
  await logout();
  await goto('/login');
}
