import type { Router } from 'express';
import { asyncRoute } from '../../shared/http/index.js';
import { requireUser, userIdOf } from '../../shared/middleware/index.js';
import { permissionsOf, requirePermission } from '../auth/access.js';
import * as roles from './roles.js';
import * as users from './service.js';
import { readNewRole, readRoleId, readRolePatch } from './validators.js';

/** Маршрути адмінки: доступ визначають рівні прав ролі */
export function adminRoutes(router: Router): void {
  router.use('/admin', requireUser, requirePermission('admin.panel', 'view'));

  router.get('/admin/users', requirePermission('users', 'view'), asyncRoute(async (_req, res) => {
    res.json(await users.listUsers());
  }));

  router.patch('/admin/users/:id', requirePermission('users', 'manage'), asyncRoute(async (req, res) => {
    const actor = await permissionsOf(req);
    res.json(await users.assignRole(req.params.id, readRoleId(req.body), userIdOf(req), actor));
  }));

  router.get('/admin/permissions', requirePermission('roles', 'view'), asyncRoute(async (_req, res) => {
    res.json(roles.listPermissions());
  }));

  // Список ролей потрібен і для призначення користувачам, тож достатньо доступу до адмінки
  router.get('/admin/roles', asyncRoute(async (_req, res) => {
    res.json(await roles.listRoles());
  }));

  router.post('/admin/roles', requirePermission('roles', 'manage'), asyncRoute(async (req, res) => {
    res.status(201).json(await roles.createRole(readNewRole(req.body), await permissionsOf(req)));
  }));

  router.patch('/admin/roles/:id', requirePermission('roles', 'manage'), asyncRoute(async (req, res) => {
    res.json(await roles.updateRole(req.params.id, readRolePatch(req.body), await permissionsOf(req)));
  }));

  router.delete('/admin/roles/:id', requirePermission('roles', 'manage'), asyncRoute(async (req, res) => {
    const reassignTo = (req.body as { reassignTo?: unknown } | undefined)?.reassignTo;
    await roles.deleteRole(req.params.id, reassignTo, await permissionsOf(req));
    res.status(204).end();
  }));
}
