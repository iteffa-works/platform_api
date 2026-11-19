/** Адмінка: користувачі й ролі (дані auth) — доступ до адмінки + рівень права розділу */
import type { Router } from 'express';
import { guards, use } from '../../../flowaxy/services/index.js';
import { asyncRoute, readIdParam } from '../../../shared/http/index.js';
import { userIdOf } from '../../../shared/middleware/index.js';
import * as roles from './roles.service.js';
import * as users from './users.service.js';
import { readNewRole, readReassignTo, readRoleId, readRolePatch } from './validators.js';

export function adminRoutes(router: Router): void {
  const admin = [guards.user, guards.permission('admin.panel', 'view')];
  const actor = (req: Parameters<typeof userIdOf>[0]) => use('access').permissionsOf(req);

  router.get('/admin/users', ...admin, guards.permission('users', 'view'), asyncRoute(async (_req, res) => {
    res.json(await users.listUsers());
  }));

  router.patch('/admin/users/:id', ...admin, guards.permission('users', 'manage'), asyncRoute(async (req, res) => {
    const userId = readIdParam(req.params.id, 'Користувача не знайдено');
    res.json(await users.assignRole(req, userId, readRoleId(req.body), userIdOf(req), await actor(req)));
  }));

  router.get('/admin/permissions', ...admin, guards.permission('roles', 'view'), asyncRoute(async (_req, res) => {
    res.json(roles.listPermissions());
  }));

  // Список ролей потрібен і для призначення користувачам, тож достатньо доступу до адмінки
  router.get('/admin/roles', ...admin, asyncRoute(async (_req, res) => {
    res.json(await roles.listRoles());
  }));

  router.post('/admin/roles', ...admin, guards.permission('roles', 'manage'), asyncRoute(async (req, res) => {
    res.status(201).json(await roles.createRole(readNewRole(req.body), await actor(req)));
  }));

  router.patch('/admin/roles/:id', ...admin, guards.permission('roles', 'manage'), asyncRoute(async (req, res) => {
    const roleId = readIdParam(req.params.id, 'Роль не знайдено');
    res.json(await roles.updateRole(roleId, readRolePatch(req.body), await actor(req)));
  }));

  router.delete('/admin/roles/:id', ...admin, guards.permission('roles', 'manage'), asyncRoute(async (req, res) => {
    const roleId = readIdParam(req.params.id, 'Роль не знайдено');
    await roles.deleteRole(roleId, readReassignTo(req.body), await actor(req));
    res.status(204).end();
  }));
}
