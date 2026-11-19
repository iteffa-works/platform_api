import type { Request, Response } from 'express';
import { track } from '../../flowaxy/activity/index.js';
import { createRateLimiter } from '../../shared/http/index.js';
import { publicUser } from './core/service.js';
import type { User } from './models/user.js';
import { startSession } from './sessions.js';

/** Захист від підбору: 10 спроб входу за 15 хв на пару IP + email */
export const loginLimiter = createRateLimiter({
  windowMs: 15 * 60_000,
  max: 10,
  message: 'Забагато спроб входу. Спробуйте за кілька хвилин',
});

/** Те саме для коду 2FA — на користувача */
export const twoFactorLimiter = createRateLimiter({
  windowMs: 15 * 60_000,
  max: 10,
  message: 'Забагато спроб коду. Спробуйте за кілька хвилин',
});

export function loginKey(req: Request, email: string): string {
  return `${req.ip}|${email}`;
}

/** Завершити вхід: серверна сесія (cookie) + запис у журнал */
export async function completeLogin(req: Request, res: Response, user: User, { action = 'auth.login', twoFactor = false } = {}) {
  await startSession(req, res, user.id, twoFactor);
  await track(req, user.id, action);
  return { user: publicUser(user) };
}
