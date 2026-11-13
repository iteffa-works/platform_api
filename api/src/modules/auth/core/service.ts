import { UniqueConstraintError } from 'sequelize';
import { sequelize } from '../../../core/db/index.js';
import { emit } from '../../../core/events/index.js';
import { hashPassword, signToken, verifyPassword } from '../../../shared/crypto/index.js';
import { HttpError } from '../../../shared/http/index.js';
import { DEFAULT_ROLE, DEVELOPER_ROLE, findRoleBySlug, Role } from '../models/role.js';
import { findUserWithRole, User } from '../models/user.js';

/** Роль у публічних відповідях */
export function publicRole(role: Role) {
  return { id: role.id, slug: role.slug, name: role.name };
}

/** Публічні поля користувача; `user.role` має бути завантажена */
export function publicUser(user: User) {
  if (!user.role) throw new Error('publicUser: роль не завантажена');
  return {
    id: user.id,
    email: user.email,
    role: publicRole(user.role),
    permissions: user.role.permissions,
  };
}

export type PublicUser = ReturnType<typeof publicUser>;

/** Реєстрація: перший користувач — розробник, решта — роль за замовчуванням */
export async function register(email: string, password: string) {
  const passwordHash = await hashPassword(password);
  try {
    const user = await sequelize.transaction(async (transaction) => {
      // Блокування: два одночасні «перші» користувачі не стануть обидва розробниками
      const existing = await User.findOne({ attributes: ['id'], transaction, lock: transaction.LOCK.UPDATE });
      const isFirst = !existing;
      const role = await findRoleBySlug(isFirst ? DEVELOPER_ROLE : DEFAULT_ROLE);
      const created = await User.create({ email, passwordHash, roleId: role.id }, { transaction });
      created.role = role;
      return created;
    });
    await emit('auth.registered', { userId: user.id, role: user.role?.slug });
    return { token: signToken(user.id), user: publicUser(user) };
  } catch (err) {
    if (err instanceof UniqueConstraintError) {
      throw new HttpError(409, 'Такий email уже зареєстровано');
    }
    throw err;
  }
}

/** Вхід за email і паролем */
export async function login(email: string, password: string) {
  const user = await User.findOne({ where: { email }, include: [{ model: Role, as: 'role' }] });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw new HttpError(401, 'Невірний email або пароль');
  }
  await emit('auth.logged-in', { userId: user.id });
  return { token: signToken(user.id), user: publicUser(user) };
}

/** Поточний користувач за JWT */
export async function me(userId: number) {
  const user = await findUserWithRole(userId);
  if (!user) throw new HttpError(401, 'Сесія недійсна');
  return { user: publicUser(user) };
}
