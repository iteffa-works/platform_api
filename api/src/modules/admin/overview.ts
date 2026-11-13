import { Op } from 'sequelize';
import { permissionCatalog } from '../../core/access/index.js';
import { Role } from '../auth/models/role.js';
import { User } from '../auth/models/user.js';

/** Показники головної адмінки */
export async function overview() {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [users, usersThisMonth, roles, customRoles] = await Promise.all([
    User.count(),
    User.count({ where: { createdAt: { [Op.gte]: monthStart } } }),
    Role.count(),
    Role.count({ where: { isSystem: false } }),
  ]);

  return {
    users: { total: users, thisMonth: usersThisMonth },
    roles: { total: roles, custom: customRoles },
    resources: Object.keys(permissionCatalog()).length,
  };
}
