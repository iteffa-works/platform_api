import type { Request } from 'express';
import { emit } from '../events/index.js';

/**
 * Дія користувача → подія `activity`.
 * Журнал (модуль activity) і сповіщення (модуль notifications) підписані на неї —
 * модулі, що діють, не залежать від тих, що слухають.
 */
export type ActivityEvent = {
  userId: number;
  /** Ключ дії: `auth.login`, `password.changed`, `role.changed`, … */
  action: string;
  ip: string | null;
  userAgent: string | null;
  meta?: Record<string, unknown>;
};

export function requestContext(req: Request | null): Pick<ActivityEvent, 'ip' | 'userAgent'> {
  if (!req) return { ip: null, userAgent: null };
  return {
    ip: req.ip ?? null,
    userAgent: String(req.headers['user-agent'] || '').slice(0, 255) || null,
  };
}

/** Зафіксувати дію (без запиту — системна дія, напр. з адмінки над іншим користувачем) */
export function track(req: Request | null, userId: number, action: string, meta?: Record<string, unknown>): Promise<void> {
  return emit('activity', { userId, action, meta, ...requestContext(req) } satisfies ActivityEvent);
}
