import { HttpError } from '../../../shared/http/index.js';

/**
 * Адреса HTTP-панелі: лише http(s), без логіна / параметрів / якоря; без кінцевого `/` і службового суфікса.
 * `https://host:1500/ispmgr/` + suffix `/ispmgr` → `https://host:1500`
 */
export function normalizeHttpUrl(input: unknown, suffix = ''): string {
  let url: URL;
  try {
    url = new URL(String(input ?? '').trim());
  } catch {
    throw new HttpError(400, 'Адреса панелі: повний URL, напр. https://host:1500');
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new HttpError(400, 'Адреса панелі: лише http або https');
  if (url.username || url.password || url.search || url.hash) throw new HttpError(400, 'Адреса панелі: без логіна, параметрів і #');
  let pathname = url.pathname.replace(/\/+$/, '');
  if (suffix && pathname.endsWith(suffix)) pathname = pathname.slice(0, -suffix.length);
  return `${url.origin}${pathname}`;
}
