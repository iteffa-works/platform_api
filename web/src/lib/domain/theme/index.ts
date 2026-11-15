/**
 * Тема інтерфейсу: світла / темна.
 * - cookie `theme` — вибір на пристрої; hooks.server ставить <html data-theme> ще на SSR;
 * - акаунт (user_preferences) — вибір залогіненого користувача, має пріоритет.
 * Стан читається з документа в браузері (на сервері модуль спільний для всіх запитів).
 */
import { get, writable } from 'svelte/store';
import { readDeviceCookie, saveToAccount, writeDeviceCookie } from '$lib/core/preferences';

export const THEMES = ['light', 'dark'] as const;
export type Theme = (typeof THEMES)[number];

export const THEME_COOKIE = 'theme';
export const DEFAULT_THEME: Theme = 'light';

export function isTheme(value: unknown): value is Theme {
  return THEMES.includes(value as Theme);
}

export const theme = writable<Theme>(DEFAULT_THEME);

const inBrowser = typeof document !== 'undefined';
let initialized = false;

function init(): void {
  if (initialized || !inBrowser) return;
  initialized = true;
  const current = document.documentElement.dataset.theme;
  theme.set(isTheme(current) ? current : DEFAULT_THEME);
}

function apply(value: Theme): void {
  theme.set(value);
  if (!inBrowser) return;
  document.documentElement.dataset.theme = value;
  writeDeviceCookie(THEME_COOKIE, value);
}

/** Змінити тему: документ + cookie, а для залогіненого — ще й акаунт */
export function setTheme(value: Theme): Promise<void> {
  init();
  apply(value);
  return saveToAccount({ theme: value });
}

export function toggleTheme(): Promise<void> {
  init();
  return setTheme(get(theme) === 'dark' ? 'light' : 'dark');
}

/** Після завантаження акаунта: тема акаунта має пріоритет; немає — зберегти вибір пристрою */
export function applyAccountTheme(accountTheme: Theme | null): void {
  init();
  if (!inBrowser) return;
  if (accountTheme) {
    if (accountTheme !== get(theme)) apply(accountTheme);
    return;
  }
  if (readDeviceCookie(THEME_COOKIE)) void saveToAccount({ theme: get(theme) });
}
