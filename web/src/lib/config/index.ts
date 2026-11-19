/**
 * Публічні налаштування сайту — зі змінних середовища (`PUBLIC_*`, у web/.env або оточенні процесу).
 * Домен — для canonical, Open Graph і sitemap; назва — для заголовків і футера.
 */
import { env } from '$env/dynamic/public';

/** Публічний домен без завершального `/` (production — https://ваш-домен) */
export const APP_ORIGIN = (env.PUBLIC_APP_ORIGIN || 'https://sandbox.local').replace(/\/+$/, '');
export const APP_NAME = env.PUBLIC_APP_NAME || 'Flowaxy';
