/**
 * Тема інтерфейсу: світла / темна.
 * - cookie `theme` — вибір на пристрої; hooks.server ставить <html data-theme> ще на SSR;
 * - акаунт (`user_preferences`, PATCH /cabinet/preferences) — вибір залогіненого користувача.
 * Стан читається з документа в браузері (на сервері модуль спільний для всіх запитів).
 */
import { get, writable } from 'svelte/store';
import { api } from '$lib/core/api';
import { getToken } from '$lib/core/session';

export const THEMES = ['light', 'dark'] as const;
export type Theme = (typeof THEMES)[number];

export const THEME_COOKIE = 'theme';
export const DEFAULT_THEME: Theme = 'light';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isTheme(value: unknown): value is Theme {
  return THEMES.includes(value as Theme);
}

export const theme = writable<Theme>(DEFAULT_THEME);

const inBrowser = typeof document !== 'undefined';
let initialized = false;
/** Чи обирав користувач тему на цьому пристрої (є cookie) */
let chosenOnDevice = false;

function init(): void {
  if (initialized || !inBrowser) return;
  initialized = true;
  const current = document.documentElement.dataset.theme;
  theme.set(isTheme(current) ? current : DEFAULT_THEME);
  chosenOnDevice = document.cookie.split('; ').some((part) => part.startsWith(`${THEME_COOKIE}=`));
}

function apply(value: Theme): void {
  theme.set(value);
  chosenOnDevice = true;
  if (!inBrowser) return;
  document.documentElement.dataset.theme = value;
  document.cookie = `${THEME_COOKIE}=${value}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

/** Змінити тему: документ + cookie, а для залогіненого — ще й акаунт */
export async function setTheme(value: Theme): Promise<void> {
  init();
  apply(value);
  if (getToken()) {
    await api('/cabinet/preferences', { method: 'PATCH', body: { theme: value } }).catch(() => undefined);
  }
}

export function toggleTheme(): Promise<void> {
  init();
  return setTheme(get(theme) === 'dark' ? 'light' : 'dark');
}

/**
 * Після завантаження акаунта: тема акаунта має пріоритет над cookie;
 * якщо в акаунті ще не обрано, а на пристрої обрано — зберегти вибір в акаунт.
 */
export function applyAccountTheme(accountTheme: Theme | null): void {
  init();
  if (!inBrowser) return;
  if (accountTheme) {
    if (accountTheme !== get(theme) || !chosenOnDevice) apply(accountTheme);
    return;
  }
  if (chosenOnDevice) void setTheme(get(theme));
}
