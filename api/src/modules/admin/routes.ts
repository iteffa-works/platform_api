import type { Router } from 'express';
import { asyncRoute, readIdParam } from '../../shared/http/index.js';
import { userIdOf } from '../../shared/middleware/index.js';
import { permissionsOf, requirePermission, requireUser } from '../auth/access.js';
import { overview } from './overview.js';
import * as roles from './roles.js';
import * as users from './service.js';
import { readNewRole, readReassignTo, readRoleId, readRolePatch } from './validators.js';

/** Маршрути адмінки: доступ визначають рівні прав ролі */
export function adminRoutes(router: Router): void {
  router.use('/admin', requireUser, requirePermission('admin.panel', 'view'));

  router.get('/admin/overview', asyncRoute(async (_req, res) => {
    res.json(await overview());
  }));

  router.get('/admin/users', requirePermission('users', 'view'), asyncRoute(async (_req, res) => {
    res.json(await users.listUsers());
  }));

  router.patch('/admin/users/:id', requirePermission('users', 'manage'), asyncRoute(async (req, res) => {
    const actor = await permissionsOf(req);
    const userId = readIdParam(req.params.id, 'Користувача не знайдено');
    res.json(await users.assignRole(req, userId, readRoleId(req.body), userIdOf(req), actor));
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
    const roleId = readIdParam(req.params.id, 'Роль не знайдено');
    res.json(await roles.updateRole(roleId, readRolePatch(req.body), await permissionsOf(req)));
  }));

  router.delete('/admin/roles/:id', requirePermission('roles', 'manage'), asyncRoute(async (req, res) => {
    const roleId = readIdParam(req.params.id, 'Роль не знайдено');
    await roles.deleteRole(roleId, readReassignTo(req.body), await permissionsOf(req));
    res.status(204).end();
  }));
}
