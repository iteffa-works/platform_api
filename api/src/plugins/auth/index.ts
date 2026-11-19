/**
 * Плагін auth: користувачі, ролі й права, сесії, вхід / реєстрація, 2FA, аватари, налаштування.
 * Владіє і своїми екранами: «мій акаунт» (`/cabinet/*`), адмінка користувачів і ролей (`/admin/users`, `/admin/roles`).
 * Іншим плагінам дає порти `access` (перевірки доступу) і `users` (публічні дані користувачів) — без імпорту моделей.
 */
import type { Router } from 'express';
import { Op } from 'sequelize';
import type { Plugin } from '../../flowaxy/plugins/index.js';
import { provide, type UserRef } from '../../flowaxy/services/index.js';
import { likeOf } from '../../flowaxy/ui/index.js';
import { permissionsOf, requirePermission, requireUser } from './access.js';
import { cabinetRoutes } from './account/routes.js';
import { adminRoutes } from './admin/routes.js';
import { avatarUrl, coreAuthRoutes } from './core/index.js';
import { listAuthExtensions, loadAuthExtensions } from './extensions/index.js';
import { User } from './models/user.js';
import { findSession } from './sessions.js';
import { registerAuthDashboard } from './ui/dashboard.js';
import { authUi } from './ui/index.js';

await loadAuthExtensions();

const ref = (user: User): UserRef => ({ id: user.id, email: user.email, name: user.name ?? null, avatarUrl: avatarUrl(user.avatar), createdAt: user.createdAt });
const REF_FIELDS = ['id', 'email', 'name', 'avatar', 'createdAt'];

/** Порти для плагінів: перевірки доступу й публічні дані користувачів (без моделі User) */
provide('access', {
  requireUser,
  requirePermission,
  permissionsOf,
  async sessionPermissions(req) {
    const session = await findSession(req);
    if (!session) return null;
    req.userId = session.userId;
    req.sessionId = session.id;
    return permissionsOf(req);
  },
}, 'auth');

provide('users', {
  async byIds(ids) {
    const unique = [...new Set(ids)];
    if (!unique.length) return new Map();
    const users = await User.findAll({ where: { id: { [Op.in]: unique } }, attributes: REF_FIELDS });
    return new Map(users.map((user) => [user.id, ref(user)]));
  },
  async byEmail(email) {
    const user = await User.findOne({ where: { email: email.trim().toLowerCase() }, attributes: REF_FIELDS });
    return user ? ref(user) : null;
  },
  async idsByEmailLike(text, limit = 200) {
    const users = await User.findAll({ where: { email: { [Op.like]: likeOf(text) } }, attributes: ['id'], limit });
    return users.map((user) => user.id);
  },
}, 'auth');

function mountAuthExtensionRoutes(router: Router): void {
  for (const extension of listAuthExtensions()) {
    extension.routes?.(router);
  }
}

export const plugin: Plugin = {
  name: 'auth',
  title: 'Автентифікація',
  description: 'Вхід, реєстрація, сесії, 2FA, мій акаунт, користувачі й ролі',
  defaultEnabled: true,
  contour: 'platform',
  permissions: {
    users: { label: 'Користувачі', levels: ['view', 'manage'] },
    roles: { label: 'Ролі', levels: ['view', 'manage'] },
  },
  ui: authUi,
  routes(router) {
    coreAuthRoutes(router);
    mountAuthExtensionRoutes(router);
    cabinetRoutes(router);
    adminRoutes(router);
  },
  init: registerAuthDashboard,
};
