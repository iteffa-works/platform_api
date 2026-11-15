import type { Handle } from '@sveltejs/kit';
import { DEFAULT_THEME, isTheme, THEME_COOKIE } from '$lib/domain/theme';
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE } from '$lib/i18n';

/**
 * Тема й мова з cookie одразу в <html data-theme lang> — без мерехтіння.
 * Мова також іде в locals → кореневий layout рендерить SSR потрібною мовою.
 */
export const handle: Handle = async ({ event, resolve }) => {
  const theme = event.cookies.get(THEME_COOKIE);
  const lang = event.cookies.get(LOCALE_COOKIE);
  event.locals.locale = isLocale(lang) ? lang : DEFAULT_LOCALE;
  const safeTheme = isTheme(theme) ? theme : DEFAULT_THEME;

  return resolve(event, {
    transformPageChunk: ({ html }) => html
      .replace('%app.theme%', safeTheme)
      .replace('%app.lang%', event.locals.locale),
  });
};
