/** robots.txt: індексувати публічні сторінки; кабінет, адмінку, вхід і API — ні */
import { APP_ORIGIN } from '$lib/config';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => new Response(
  [
    'User-agent: *',
    'Allow: /',
    'Disallow: /app',
    'Disallow: /admin',
    'Disallow: /api/',
    'Disallow: /login',
    'Disallow: /register',
    '',
    `Sitemap: ${APP_ORIGIN}/sitemap.xml`,
    '',
  ].join('\n'),
  { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } },
);
