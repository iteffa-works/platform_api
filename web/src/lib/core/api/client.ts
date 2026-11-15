type ApiOptions = {
  method?: string;
  /** JSON-тіло */
  body?: unknown;
  /** Сирий файл (аватар) — тип з Blob */
  raw?: Blob;
};

/** Префікс platform-контуру для веб-кабінету */
const PLATFORM_PREFIX = '/api/v1';

/** Мова повідомлень API (Accept-Language) — оновлює i18n */
let language = 'uk';

export function setApiLanguage(value: string): void {
  language = value;
}

/**
 * HTTP-клієнт кабінету / адмінки.
 * Сесія — httpOnly-cookie `sid` (same-origin), X-Requested-With — захист від CSRF.
 */
export async function api<T = unknown>(path: string, { method = 'GET', body, raw }: ApiOptions = {}): Promise<T> {
  const headers: Record<string, string> = { 'X-Requested-With': 'fetch', 'Accept-Language': language };
  if (raw) headers['Content-Type'] = raw.type || 'application/octet-stream';
  else if (body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${PLATFORM_PREFIX}${path}`, {
    method,
    headers,
    credentials: 'same-origin',
    body: raw ?? (body !== undefined ? JSON.stringify(body) : undefined),
  });

  if (res.status === 204) return null as T;
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new ApiError(data.error || res.statusText, res.status);
  return data as T;
}

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}
