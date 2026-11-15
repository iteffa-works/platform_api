import { randomBytes } from 'node:crypto';
import { UniqueConstraintError } from 'sequelize';
import { sequelize } from '../../../core/db/index.js';
import { hashPassword, verifyPassword } from '../../../shared/crypto/index.js';
import { HttpError } from '../../../shared/http/index.js';
import { DEFAULT_ROLE, DEVELOPER_ROLE, findRoleBySlug, Role } from '../models/role.js';
import { ACCOUNT_INCLUDE, findUserWithRole, User } from '../models/user.js';

/** Роль у публічних відповідях */
export function publicRole(role: Role) {
  return { id: role.id, slug: role.slug, name: role.name };
}

/** URL аватара (роздає модуль auth: GET /avatars/:file) */
export function avatarUrl(file: string | null | undefined): string | null {
  return file ? `/api/v1/avatars/${file}` : null;
}

/** Публічні поля користувача; `user.role` має бути завантажена */
export function publicUser(user: User) {
  if (!user.role) throw new Error('publicUser: роль не завантажена');
  const preferences = user.preferences;
  return {
    id: user.id,
    email: user.email,
    name: user.name ?? null,
    avatarUrl: avatarUrl(user.avatar),
    role: publicRole(user.role),
    permissions: user.role.permissions,
    twoFactor: Boolean(user.twoFactorSecret),
    referralCode: user.referralCode,
    preferences: {
      theme: preferences?.theme ?? null,
      timezone: preferences?.timezone ?? null,
      language: preferences?.language ?? null,
      antiPhishingCode: preferences?.antiPhishingCode ?? null,
    },
  };
}

export type PublicUser = ReturnType<typeof publicUser>;

function newReferralCode(): string {
  return randomBytes(6).toString('hex');
}

/**
 * Реєстрація: перший користувач — розробник, решта — роль за замовчуванням.
 * `referral` — код запрошувача (невідомий код ігнорується).
 */
export async function register(email: string, password: string, referral?: string): Promise<User> {
  const passwordHash = await hashPassword(password);
  try {
    return await sequelize.transaction(async (transaction) => {
      // Блокування: два одночасні «перші» користувачі не стануть обидва розробниками
      const existing = await User.findOne({ attributes: ['id'], transaction, lock: transaction.LOCK.UPDATE });
      const role = await findRoleBySlug(existing ? DEFAULT_ROLE : DEVELOPER_ROLE);
      const referrer = referral
        ? await User.findOne({ where: { referralCode: referral }, attributes: ['id'], transaction })
        : null;
      const created = await User.create({
        email,
        passwordHash,
        roleId: role.id,
        referralCode: newReferralCode(),
        referredById: referrer?.id ?? null,
      }, { transaction });
      created.role = role;
      created.preferences = null;
      return created;
    });
  } catch (err) {
    if (err instanceof UniqueConstraintError) throw new HttpError(409, 'Такий email уже зареєстровано');
    throw err;
  }
}

/** Перевірка email + пароль; null — невірні дані (без підказки, що саме) */
export async function verifyCredentials(email: string, password: string): Promise<User | null> {
  const user = await User.findOne({ where: { email }, include: ACCOUNT_INCLUDE });
  if (!user || !(await verifyPassword(password, user.passwordHash))) return null;
  return user;
}

/** Поточний користувач */
export async function me(userId: number) {
  const user = await findUserWithRole(userId);
  if (!user) throw new HttpError(401, 'Сесія недійсна');
  return { user: publicUser(user) };
}
