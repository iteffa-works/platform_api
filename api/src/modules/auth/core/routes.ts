import type { Router } from 'express';
import { asyncRoute } from '../../../shared/http/index.js';
import { requireUser, userIdOf } from '../../../shared/middleware/index.js';
import * as authService from './service.js';

/** Базові маршрути ядра auth (сесія) */
export function coreAuthRoutes(router: Router): void {
  router.get('/auth/me', requireUser, asyncRoute(async (req, res) => {
    res.json(await authService.me(userIdOf(req)));
  }));
}
