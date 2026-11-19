/**
 * Публічні налаштування сайту — зі змінних середовища (`PUBLIC_*`, у web/.env або оточенні процесу).
 * Домен — для canonical, Open Graph і sitemap; назва — для заголовків і футера.
 */
import { dev } from '$app/environment';
import { env } from '$env/dynamic/public';

/** Публічний домен без завершального `/` (production — https://ваш-домен) */
export const APP_ORIGIN = (env.PUBLIC_APP_ORIGIN || 'https://sandbox.local').replace(/\/+$/, '');
export const APP_NAME = env.PUBLIC_APP_NAME || 'Flowaxy';

/**
 * Режим налагодження (PUBLIC_APP_DEBUG, як APP_DEBUG у Laravel): сторінка помилки зі стеком і кодом.
 * Не задано — увімкнено під час `npm run dev`, вимкнено в зібраному застосунку.
 */
export const DEBUG = env.PUBLIC_APP_DEBUG ? ['1', 'true', 'yes', 'on'].includes(env.PUBLIC_APP_DEBUG.toLowerCase()) : dev;
