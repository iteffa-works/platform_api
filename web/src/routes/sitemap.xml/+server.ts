/** sitemap.xml: публічні сторінки сайту (головна з тарифами й розділами-якорями) */
import { APP_ORIGIN } from '$lib/config';
import type { RequestHandler } from './$types';

const PAGES = [{ path: '/', priority: '1.0', changefreq: 'weekly' }];

export const GET: RequestHandler = () => {
  const today = new Date().toISOString().slice(0, 10);
  const urls = PAGES.map((page) => `  <url><loc>${APP_ORIGIN}${page.path}</loc><lastmod>${today}</lastmod><changefreq>${page.changefreq}</changefreq><priority>${page.priority}</priority></url>`);
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } },
  );
};
