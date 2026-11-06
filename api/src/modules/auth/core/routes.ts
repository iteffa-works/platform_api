import type { Router } from 'express';
import { asyncRoute, HttpError } from '../../../shared/http/index.js';
import { requireUser } from '../../../shared/middleware/index.js';
import * as authService from './service.js';

/** Базові маршрути ядра auth (сесія) */
export function coreAuthRoutes(router: Router): void {
  router.get('/auth/me', requireUser, asyncRoute(async (req, res) => {
    if (!req.userId) throw new HttpError(401, 'Сесія недійсна');
    res.json(await authService.me(req.userId));
  }));
}
