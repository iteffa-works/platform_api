import { HttpError } from '../errors/http-error.js';

/**
 * Простий ліміт у памʼяті процесу: не більше `max` подій за `windowMs` на ключ.
 * Для кількох інстансів API — замінити на Redis / БД.
 */
export function createRateLimiter({ windowMs, max, message = 'Занадто багато запитів' }: {
  windowMs: number;
  max: number;
  message?: string;
}) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return {
    /** Зарахувати подію; 429 при перевищенні */
    hit(key: string): void {
      const now = Date.now();
      const current = hits.get(key);
      if (!current || current.resetAt <= now) {
        hits.set(key, { count: 1, resetAt: now + windowMs });
        if (hits.size > 10_000) {
          for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
        }
        return;
      }
      current.count += 1;
      if (current.count > max) throw new HttpError(429, message);
    },
    /** Скинути лічильник (успішний вхід) */
    reset(key: string): void {
      hits.delete(key);
    },
  };
}
