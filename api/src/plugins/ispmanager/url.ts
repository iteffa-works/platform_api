import { HttpError } from '../../shared/http/index.js';

/** `https://host:1500/ispmgr/` → `https://host:1500` */
export function normalizeUrl(input: unknown): string {
  let url: URL;
  try {
    url = new URL(String(input ?? '').trim());
  } catch {
    throw new HttpError(400, 'Адреса панелі: повний URL, напр. https://host:1500');
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new HttpError(400, 'Адреса панелі: лише http або https');
  if (url.username || url.password || url.search || url.hash) throw new HttpError(400, 'Адреса панелі: без логіна, параметрів і #');
  const pathname = url.pathname.replace(/\/+$/, '').replace(/\/ispmgr$/, '');
  return `${url.origin}${pathname}`;
}
