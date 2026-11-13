import type { Router } from 'express';
import { asyncRoute } from '../../shared/http/index.js';
import { requireUser, userIdOf } from '../../shared/middleware/index.js';
import * as cabinet from './service.js';

/** Кабінет: власний акаунт користувача (без окремих прав) */
export function cabinetRoutes(router: Router): void {
  router.use('/cabinet', requireUser);

  router.get('/cabinet/profile', asyncRoute(async (req, res) => {
    res.json(await cabinet.profile(userIdOf(req)));
  }));

  router.patch('/cabinet/account', asyncRoute(async (req, res) => {
    res.json(await cabinet.updateAccount(userIdOf(req), req.body));
  }));

  router.patch('/cabinet/preferences', asyncRoute(async (req, res) => {
    res.json(await cabinet.updatePreferences(userIdOf(req), req.body));
  }));

  router.post('/cabinet/password', asyncRoute(async (req, res) => {
    res.json(await cabinet.changePassword(userIdOf(req), req.body));
  }));

  router.delete('/cabinet/account', asyncRoute(async (req, res) => {
    await cabinet.deleteAccount(userIdOf(req), req.body);
    res.status(204).end();
  }));
}
