import { HttpError } from '../../shared/http/index.js';
import { publicUser } from '../auth/core/index.js';
import { User, type UserRole } from '../auth/models/user.js';

/** Список користувачів для адмінки */
export async function listUsers() {
  const rows = await User.findAll({ order: [['createdAt', 'ASC']] });
  return {
    users: rows.map((user) => ({ ...publicUser(user), createdAt: user.createdAt })),
  };
}

/** Зміна ролі користувача */
export async function setUserRole(id: string, role: UserRole, actorId: string) {
  const user = await User.findByPk(id);
  if (!user) throw new HttpError(404, 'Користувача не знайдено');

  if (user.id === actorId && role !== 'admin') {
    throw new HttpError(400, 'Не можна зняти admin із себе');
  }

  if (user.role === 'admin' && role !== 'admin') {
    const admins = await User.count({ where: { role: 'admin' } });
    if (admins <= 1) throw new HttpError(400, 'Має лишитись хоча б один admin');
  }

  user.role = role;
  await user.save();
  return { user: publicUser(user) };
}
