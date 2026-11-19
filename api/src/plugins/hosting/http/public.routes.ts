/**
 * Публічні дані хостингу (без входу): вітрина тарифів для головної сторінки.
 * Кеш на хвилину — головна відкривається часто, а тарифи змінюються рідко; зміни в адмінці видно за ≤ 60 с.
 */
import type { Router } from 'express';
import { config } from '../../../config/index.js';
import type { HostingModule } from '../module.js';
import { json } from './guards.js';

const TTL_MS = 60_000;

export function publicRoutes(router: Router, hosting: HostingModule): void {
  let cached: { expires: number; value: Promise<unknown> } | null = null;

  // Браузер / CDN можуть кешувати хвилину — так само, як кеш нижче
  router.get('/public/hosting/plans', (_req, res, next) => {
    res.setHeader('Cache-Control', 'public, max-age=60');
    next();
  }, json(() => {
    const now = Date.now();
    if (!cached || cached.expires < now) {
      const value = hosting.plans.showcase().then((data) => ({ currency: config.currency, periods: hosting.config.periods, ...data }));
      value.catch(() => (cached = null));
      cached = { expires: now + TTL_MS, value };
    }
    return cached.value;
  }));
}
