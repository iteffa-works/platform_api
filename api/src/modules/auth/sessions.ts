import type { Request, Response } from 'express';
import { Op } from 'sequelize';
import { requestContext } from '../../core/activity/index.js';
import { config } from '../../config/index.js';
import { randomToken, sha256 } from '../../shared/crypto/index.js';
import { readCookie } from '../../shared/http/index.js';
import { Session } from './models/session.js';

/** httpOnly-cookie з токеном сесії; JS сторінки його не бачить */
export const SESSION_COOKIE = 'sid';
const TOUCH_INTERVAL_MS = 5 * 60_000;

function cookieOptions(maxAge?: number) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: config.isProduction,
    path: '/',
    ...(maxAge !== undefined ? { maxAge } : {}),
  };
}

/** Нова сесія після входу / реєстрації */
export async function startSession(req: Request, res: Response, userId: number): Promise<Session> {
  const token = randomToken();
  const ttl = config.sessionTtlDays * 86_400_000;
  const now = new Date();
  const session = await Session.create({
    userId,
    tokenHash: sha256(token),
    ...requestContext(req),
    lastSeenAt: now,
    expiresAt: new Date(now.getTime() + ttl),
  });
  res.cookie(SESSION_COOKIE, token, cookieOptions(ttl));
  return session;
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE, cookieOptions());
}

/** Активна сесія з cookie запиту; оновлює lastSeenAt не частіше ніж раз на 5 хв */
export async function findSession(req: Request): Promise<Session | null> {
  const token = readCookie(req, SESSION_COOKIE);
  if (!token) return null;

  const session = await Session.findOne({
    where: { tokenHash: sha256(token), revokedAt: null, expiresAt: { [Op.gt]: new Date() } },
  });
  if (session && Date.now() - session.lastSeenAt.getTime() > TOUCH_INTERVAL_MS) {
    session.lastSeenAt = new Date();
    await session.save();
  }
  return session;
}

/** Відкликати одну сесію користувача; false — не знайдено */
export async function revokeSession(userId: number, sessionId: number): Promise<boolean> {
  const [count] = await Session.update(
    { revokedAt: new Date() },
    { where: { id: sessionId, userId, revokedAt: null } },
  );
  return count > 0;
}

/** Відкликати всі сесії, крім поточної (зміна пароля, «вийти на інших пристроях») */
export async function revokeOtherSessions(userId: number, keepSessionId: number | null): Promise<number> {
  const [count] = await Session.update(
    { revokedAt: new Date() },
    { where: { userId, revokedAt: null, ...(keepSessionId ? { id: { [Op.ne]: keepSessionId } } : {}) } },
  );
  return count;
}

/** Активні сесії користувача для списку пристроїв */
export function listActiveSessions(userId: number) {
  return Session.findAll({
    where: { userId, revokedAt: null, expiresAt: { [Op.gt]: new Date() } },
    order: [['lastSeenAt', 'DESC']],
  });
}
