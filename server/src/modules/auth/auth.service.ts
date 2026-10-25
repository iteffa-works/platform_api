import { UniqueConstraintError } from 'sequelize';
import { User } from '../../models/index.js';
import { hashPassword, signToken, verifyPassword } from '../../shared/crypto/index.js';
import { HttpError } from '../../shared/http/index.js';

function publicUser(user: User) {
  return { id: user.id, email: user.email };
}

export async function register(email: string, password: string) {
  try {
    const user = await User.create({
      email,
      passwordHash: await hashPassword(password),
    });
    return { token: signToken(user.id), user: publicUser(user) };
  } catch (err) {
    if (err instanceof UniqueConstraintError) {
      throw new HttpError(409, 'Такий email уже зареєстровано');
    }
    throw err;
  }
}

export async function login(email: string, password: string) {
  const user = await User.findOne({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw new HttpError(401, 'Невірний email або пароль');
  }
  return { token: signToken(user.id), user: publicUser(user) };
}

export async function me(userId: string) {
  const user = await User.findByPk(userId);
  if (!user) throw new HttpError(401, 'Сесія недійсна');
  return { user: publicUser(user) };
}
