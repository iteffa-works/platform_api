import type { Handle, HandleServerError } from '@sveltejs/kit';
import { DEBUG } from '$lib/config';
import { ApiError } from '$lib/core/api/client';
import { serverDebugInfo } from '$lib/server/debug';
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
  // Cookie сесії API (httpOnly `sid`): гостьові сторінки з нею не рендеряться на сервері
  event.locals.hasSession = Boolean(event.cookies.get('sid'));
  const safeTheme = isTheme(theme) ? theme : DEFAULT_THEME;

  const response = await resolve(event, {
    transformPageChunk: ({ html }) => html
      .replace('%app.theme%', safeTheme)
      .replace('%app.lang%', event.locals.locale),
  });

  // Заголовки безпеки сторінок (HTTPS-заголовок HSTS ставить reverse proxy)
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  return response;
};

/**
 * Непередбачені помилки SSR: завжди в лог; у режимі DEBUG — клас, стек і код для сторінки помилки.
 * Повідомлення в DEBUG містить і стек: його показує запасна сторінка src/error.html (коли впав кореневий layout).
 */
export const handleError: HandleServerError = async ({ error, event, status, message }) => {
  console.error(`[web] ${event.request.method} ${event.url.pathname} → ${status}`, error);
  if (!DEBUG) return { message };
  if (error instanceof ApiError && error.debug) return { message: error.message, debug: error.debug };
  const debug = await serverDebugInfo(error, event);
  return { message: error instanceof Error ? (error.stack ?? error.message) : debug.message, debug };
};
