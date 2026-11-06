import { UniqueConstraintError } from 'sequelize';
import { emit } from '../../core/events/index.js';
import { hashPassword, signToken, verifyPassword } from '../../shared/crypto/index.js';
import { HttpError } from '../../shared/http/index.js';
import { User, type UserRole } from './models/user.js';

/** Публічні поля користувача */
function publicUser(user: User) {
  return { id: user.id, email: user.email, role: user.role as UserRole };
}

/** Реєстрація; перший користувач стає admin */
export async function register(email: string, password: string) {
  try {
    const isFirst = (await User.count()) === 0;
    const user = await User.create({
      email,
      passwordHash: await hashPassword(password),
      role: isFirst ? 'admin' : 'user',
    });
    await emit('auth.registered', { userId: user.id, role: user.role });
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
  const user = await User.findOne({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw new HttpError(401, 'Невірний email або пароль');
  }
  await emit('auth.logged-in', { userId: user.id });
  return { token: signToken(user.id), user: publicUser(user) };
}

/** Поточний користувач за JWT */
export async function me(userId: string) {
  const user = await User.findByPk(userId);
  if (!user) throw new HttpError(401, 'Сесія недійсна');
  return { user: publicUser(user) };
}
