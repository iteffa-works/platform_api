import path from 'node:path';
import { fileURLToPath } from 'node:url';
import '../env.js';

/** Назва для зовнішніх систем (застосунок 2FA, листи) */
export const APP_TITLE = process.env.APP_TITLE || 'Platform';

export const config = {
  port: Number(process.env.PORT || 4000),
  secret: process.env.APP_SECRET || 'dev-only-change-me',
  /** Сесія користувача (cookie `sid`), днів */
  sessionTtlDays: Number(process.env.SESSION_TTL_DAYS || 30),
  /** Ключ для /api/client/v1 (desktop / скрипти) */
  clientApiKey: process.env.CLIENT_API_KEY || 'dev-client-key',
  /** Простий rate limit клієнтського контуру (запитів / хвилину на ключ) */
  clientRateLimitPerMinute: Number(process.env.CLIENT_RATE_LIMIT_PER_MINUTE || 120),
  isProduction: process.env.NODE_ENV === 'production',
  /**
   * Режим налагодження (APP_DEBUG): помилки 500 повертають клас, повідомлення й стек з кодом.
   * Не задано — увімкнено в розробці, вимкнено в production.
   */
  debug: process.env.APP_DEBUG ? ['1', 'true', 'yes', 'on'].includes(process.env.APP_DEBUG.toLowerCase()) : process.env.NODE_ENV !== 'production',
  /** Файли застосунку (аватари); api/data у .gitignore */
  dataDir: process.env.DATA_DIR || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../data'),
  /** Валюта балансу (ISO 4217) */
  currency: process.env.CURRENCY || 'UAH',
};
