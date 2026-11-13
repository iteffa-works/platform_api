import type { Handle } from '@sveltejs/kit';
import { DEFAULT_THEME, isTheme, THEME_COOKIE } from '$lib/domain/theme';

/** Тема з cookie одразу в <html data-theme> — без мерехтіння світлої теми */
export const handle: Handle = async ({ event, resolve }) => {
  const cookie = event.cookies.get(THEME_COOKIE);
  const theme = isTheme(cookie) ? cookie : DEFAULT_THEME;

  return resolve(event, {
    transformPageChunk: ({ html }) => html.replace('%app.theme%', theme),
  });
};
