import type { Request } from 'express';
import { track } from '../../../flowaxy/activity/index.js';
import { isWithin, type Permissions } from '../../../flowaxy/access/index.js';
import { HttpError } from '../../../shared/http/index.js';
import { avatarUrl, publicRole } from '../core/index.js';
import { DEVELOPER_ROLE, Role } from '../models/role.js';
import { findUserWithRole, User } from '../models/user.js';

/** Список користувачів для адмінки */
export async function listUsers() {
  const rows = await User.findAll({
    include: [{ model: Role, as: 'role' }],
    order: [['createdAt', 'ASC']],
  });
  return {
    users: rows.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: avatarUrl(user.avatar),
      role: publicRole(user.role!),
      createdAt: user.createdAt,
    })),
  };
}

/**
 * Призначити роль користувачу.
 * Не можна: змінити власну роль, торкатися розробника, видати чи зняти права вищі за власні.
 */
export async function assignRole(req: Request, userId: number, roleId: number, actorId: number, actor: Permissions) {
  if (userId === actorId) throw new HttpError(400, 'Не можна змінити власну роль');

  const user = await findUserWithRole(userId);
  if (!user?.role) throw new HttpError(404, 'Користувача не знайдено');
  if (user.role.isDeveloper) {
    throw new HttpError(403, 'Роль розробника змінюється лише передачею');
  }

  const role = await Role.findByPk(roleId);
  if (!role) throw new HttpError(404, 'Роль не знайдено');
  if (role.slug === DEVELOPER_ROLE) throw new HttpError(403, 'Роль розробника не призначається');

  if (!isWithin(role.permissions, actor) || !isWithin(user.role.permissions, actor)) {
    throw new HttpError(403, 'Не можна керувати правами вищими за власні');
  }

  user.roleId = role.id;
  await user.save();
  await track(null, user.id, 'role.changed', { role: role.name });
  await track(req, actorId, 'admin.role_assigned', { userId: user.id, role: role.name });
  return { user: { id: user.id, email: user.email, role: publicRole(role) } };
}
