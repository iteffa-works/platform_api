import type { Router } from 'express';
import { asyncRoute } from '../../shared/http/index.js';
import { requireUser, userIdOf } from '../../shared/middleware/index.js';
import * as cabinet from './service.js';

export function cabinetRoutes(router: Router): void {
  router.use('/cabinet', requireUser);

  router.get('/cabinet/profile', asyncRoute(async (req, res) => {
    res.json(await cabinet.profile(userIdOf(req)));
  }));
}
