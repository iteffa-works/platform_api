import type { Router } from 'express';
import { asyncRoute } from '../../../../shared/http/index.js';
import { authConfig } from '../../config.js';
import { login, readCredentials, register } from '../../core/index.js';
import { runAuthHooks } from '../registry.js';
import type { AuthExtension } from '../types.js';

function bodyRecord(body: unknown): Record<string, unknown> {
  return body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
}

/** Маршрути форми: login / register */
function formRoutes(router: Router): void {
  router.post('/auth/register', asyncRoute(async (req, res) => {
    const { email, password } = readCredentials(req.body);
    const ctx = { email, body: bodyRecord(req.body), req };
    await runAuthHooks('beforeRegister', ctx);
    const result = await register(email, password);
    await runAuthHooks('afterRegister', { ...ctx, user: result.user, result });
    res.status(201).json(result);
  }));

  router.post('/auth/login', asyncRoute(async (req, res) => {
    const { email, password } = readCredentials(req.body);
    const ctx = { email, body: bodyRecord(req.body), req };
    await runAuthHooks('beforeLogin', ctx);
    const result = await login(email, password);
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
