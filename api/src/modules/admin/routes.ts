import type { Router } from 'express';
import { asyncRoute } from '../../shared/http/index.js';
import { requireAdmin, requireUser, userIdOf } from '../../shared/middleware/index.js';
import * as adminService from './service.js';
import { readRole } from './validators.js';

/** Маршрути адмінки */
export function adminRoutes(router: Router): void {
  router.use('/admin', requireUser, requireAdmin);

  router.get('/admin/users', asyncRoute(async (_req, res) => {
    res.json(await adminService.listUsers());
  }));

  router.patch('/admin/users/:id', asyncRoute(async (req, res) => {
    res.json(await adminService.setUserRole(req.params.id, readRole(req.body), userIdOf(req)));
  }));
}
