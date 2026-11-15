/**
 * Переклади інтерфейсу (uk — основна, en, ru).
 * - SSR: екземпляр на запит через Svelte-контекст (мова з cookie `lang`) — без змішування мов між запитами;
 * - браузер: той самий екземпляр + синхронізація з акаунтом (user_preferences.language).
 * Ключі типізовані за uk-словником: невідомий ключ — помилка svelte-check.
 */
import { getContext, setContext } from 'svelte';
import { derived, get, writable, type Readable, type Writable } from 'svelte/store';
import { setApiLanguage } from '$lib/core/api';
import { readDeviceCookie, saveToAccount, writeDeviceCookie } from '$lib/core/preferences';
import { dateLocale } from '$lib/shared/utils';
import { en } from './en.js';
import { ru } from './ru.js';
import { uk, type MessageKey } from './uk.js';

export type { MessageKey };

export const LOCALES = ['uk', 'en', 'ru'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'uk';
export const LOCALE_COOKIE = 'lang';

export const LOCALE_NAMES: Record<Locale, string> = { uk: 'Українська', en: 'English', ru: 'Русский' };
const BCP47: Record<Locale, string> = { uk: 'uk-UA', en: 'en-GB', ru: 'ru-RU' };

const DICTIONARIES: Record<Locale, Record<MessageKey, string>> = { uk, en, ru };


type Params = Record<string, string | number>;

function format(template: string, params?: Params): string {
  return params ? template.replace(/\{(\w+)\}/g, (_m, name: string) => String(params[name] ?? `{${name}}`)) : template;
}

export type Translate = (key: MessageKey, params?: Params) => string;
/** Динамічний ключ (`activity.${action}`) з запасним текстом */
export type TranslateDynamic = (key: string, fallback?: string, params?: Params) => string;

export type I18n = {
  locale: Writable<Locale>;
  t: Readable<Translate>;
  tx: Readable<TranslateDynamic>;
};

/** Назва ролі: системні (developer, user) — перекладом, власні — як названі в адмінці */
export function roleName(tx: TranslateDynamic, role: { slug: string; name: string } | null | undefined): string {
  return role ? tx(`role.${role.slug}`, role.name) : '';
}

export function createI18n(initial: Locale): I18n {
  const locale = writable(initial);
  const t = derived(locale, ($locale): Translate => (key, params) => format(DICTIONARIES[$locale][key] ?? uk[key] ?? key, params));
  const tx = derived(locale, ($locale): TranslateDynamic => (key, fallback, params) => {
    const template = (DICTIONARIES[$locale] as Record<string, string>)[key] ?? (uk as Record<string, string>)[key];
    return template ? format(template, params) : (fallback ?? key);
  });
  return { locale, t, tx };
}

const KEY = Symbol('i18n');
let browserInstance: I18n | null = null;

/** Кореневий layout: свій екземпляр на запит (SSR) / на вкладку (браузер) */
export function provideI18n(initial: Locale): I18n {
  const i18n = createI18n(initial);
  setContext(KEY, i18n);
  if (typeof document !== 'undefined') {
    browserInstance = i18n;
    setApiLanguage(initial);
    dateLocale.set(BCP47[initial]);
  }
  return i18n;
}

/** У компоненті: `const { t } = useI18n();` → `$t('key')` */
export function useI18n(): I18n {
  return getContext<I18n>(KEY);
}

function apply(value: Locale): void {
  if (!browserInstance) return;
  browserInstance.locale.set(value);
  document.documentElement.lang = value;
  writeDeviceCookie(LOCALE_COOKIE, value);
  setApiLanguage(value);
  dateLocale.set(BCP47[value]);
}

/** Змінити мову: інтерфейс + cookie + акаунт (якщо залогінений) */
export function setLocale(value: Locale): Promise<void> {
  apply(value);
  return saveToAccount({ language: value });
}

/** Після завантаження акаунта: мова акаунта має пріоритет; немає — зберегти вибір пристрою */
export function applyAccountLocale(accountLocale: string | null): void {
  if (!browserInstance) return;
  if (isLocale(accountLocale)) {
    if (accountLocale !== get(browserInstance.locale)) apply(accountLocale);
    return;
  }
  if (readDeviceCookie(LOCALE_COOKIE)) void saveToAccount({ language: get(browserInstance.locale) });
}
