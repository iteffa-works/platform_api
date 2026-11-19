import { createReadStream } from 'node:fs';
import { access } from 'node:fs/promises';
import type { Router } from 'express';
import { track } from '../../../flowaxy/activity/index.js';
import { asyncRoute, HttpError } from '../../../shared/http/index.js';
import { userIdOf } from '../../../shared/middleware/index.js';
import { requireUser } from '../access.js';
import { avatarPath } from '../avatar.js';
import { completeLogin, twoFactorLimiter } from '../login.js';
import { findUserWithRole } from '../models/user.js';
import { clearSessionCookie, findSession, revokeSession } from '../sessions.js';
import { readTicket, verifyCode } from '../two-factor.js';
import * as authService from './service.js';

/** Ядро auth: сесія, вихід, другий крок 2FA, роздача аватарів */
export function coreAuthRoutes(router: Router): void {
  router.get('/auth/me', requireUser, asyncRoute(async (req, res) => {
    res.json(await authService.me(userIdOf(req)));
  }));

  /** Поточна сесія без 401 для гостя: `{ user: null }` */
  router.get('/auth/session', asyncRoute(async (req, res) => {
    const session = await findSession(req);
    res.json(session ? await authService.me(session.userId) : { user: null });
  }));

  router.post('/auth/logout', asyncRoute(async (req, res) => {
    const session = await findSession(req);
    if (session) {
      await revokeSession(session.userId, session.id);
      await track(req, session.userId, 'auth.logout');
    }
    clearSessionCookie(res);
    res.status(204).end();
  }));

  /** Другий крок входу: тікет із /auth/login + код застосунку або код відновлення */
  router.post('/auth/login/2fa', asyncRoute(async (req, res) => {
    const userId = readTicket(req.body?.ticket);
    twoFactorLimiter.hit(String(userId));
    const user = await findUserWithRole(userId);
    if (!user || !(await verifyCode(user, req.body?.code))) {
      if (user) await track(req, user.id, 'auth.2fa_failed');
      throw new HttpError(400, 'Невірний код 2FA');
    }
    twoFactorLimiter.reset(String(userId));
    res.json(await completeLogin(req, res, user, { twoFactor: true }));
  }));

  /** Аватари: імена файлів випадкові, тож URL не вгадати; кеш — бо імʼя змінюється з кожним завантаженням */
  router.get('/avatars/:file', asyncRoute(async (req, res) => {
    const file = avatarPath(req.params.file);
    if (!file) throw new HttpError(404, 'Не знайдено');
    try {
      await access(file.path);
    } catch {
      throw new HttpError(404, 'Не знайдено');
    }
    res.setHeader('Content-Type', file.type);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    createReadStream(file.path).pipe(res);
  }));
}
