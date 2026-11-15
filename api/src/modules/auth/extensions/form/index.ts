import type { Router } from 'express';
import { track } from '../../../../core/activity/index.js';
import { asyncRoute, HttpError } from '../../../../shared/http/index.js';
import { authConfig } from '../../config.js';
import { publicUser, readCredentials, register, verifyCredentials } from '../../core/index.js';
import { completeLogin, loginKey, loginLimiter } from '../../login.js';
import { startSession } from '../../sessions.js';
import { issueTicket } from '../../two-factor.js';
import { runAuthHooks } from '../registry.js';
import type { AuthExtension } from '../types.js';

function bodyRecord(body: unknown): Record<string, unknown> {
  return body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
}

/** Маршрути форми: register / login (з другим кроком 2FA — POST /auth/login/2fa) */
function formRoutes(router: Router): void {
  router.post('/auth/register', asyncRoute(async (req, res) => {
    const { email, password } = readCredentials(req.body);
    const body = bodyRecord(req.body);
    const ctx = { email, body, req };
    await runAuthHooks('beforeRegister', ctx);

    const referral = typeof body.ref === 'string' ? body.ref.slice(0, 16) : undefined;
    const user = await register(email, password, referral);
    await startSession(req, res, user.id);
    await track(req, user.id, 'auth.registered', user.referredById ? { referredBy: user.referredById } : undefined);
    if (user.referredById) await track(null, user.referredById, 'referral.joined');

    const result = { user: publicUser(user) };
    await runAuthHooks('afterRegister', { ...ctx, user: result.user, result });
    res.status(201).json(result);
  }));

  router.post('/auth/login', asyncRoute(async (req, res) => {
    const { email, password } = readCredentials(req.body);
    const ctx = { email, body: bodyRecord(req.body), req };
    loginLimiter.hit(loginKey(req, email));
    await runAuthHooks('beforeLogin', ctx);

    const user = await verifyCredentials(email, password);
    if (!user) throw new HttpError(401, 'Невірний email або пароль');
    loginLimiter.reset(loginKey(req, email));

    // 2FA: сесії ще немає — лише тікет на другий крок
    if (user.twoFactorSecret) {
      res.json({ twoFactor: true, ticket: issueTicket(user.id) });
      return;
    }

    const result = await completeLogin(req, res, user);
    await runAuthHooks('afterLogin', { ...ctx, user: result.user, result });
    res.json(result);
  }));
}

/** Розширення форми авторизації / реєстрації */
export const extension: AuthExtension = {
  name: 'form',
  enabled: authConfig.form,
  routes: formRoutes,
};
