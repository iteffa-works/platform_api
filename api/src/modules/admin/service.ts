import { isWithin, type Permissions } from '../../core/access/index.js';
import { HttpError } from '../../shared/http/index.js';
import { publicRole } from '../auth/core/index.js';
import { DEVELOPER_ROLE, Role } from '../auth/models/role.js';
import { findUserWithRole, User } from '../auth/models/user.js';

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
      role: publicRole(user.role!),
      createdAt: user.createdAt,
    })),
  };
}

/**
 * Призначити роль користувачу.
 * Не можна: змінити власну роль, торкатися розробника, видати чи зняти права вищі за власні.
 */
export async function assignRole(userId: string, roleId: string, actorId: string, actor: Permissions) {
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
  return { user: { id: user.id, email: user.email, role: publicRole(role) } };
}
