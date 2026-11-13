import { effectiveLevel, permissionCatalog } from '../../core/access/index.js';
import { hashPassword, verifyPassword } from '../../shared/crypto/index.js';
import { HttpError } from '../../shared/http/index.js';
import { publicUser, readPassword } from '../auth/core/index.js';
import { isTheme, isTimeZone, UserPreference } from '../auth/models/user-preference.js';
import { findUserWithRole, User } from '../auth/models/user.js';

type Body = Record<string, unknown>;

function body(value: unknown): Body {
  return value && typeof value === 'object' ? (value as Body) : {};
}

async function account(userId: number) {
  const user = await findUserWithRole(userId);
  if (!user?.role) throw new HttpError(401, 'Сесія недійсна');
  return user;
}

/** Профіль: хто я, з якою роллю і що мені доступно (за каталогом ресурсів) */
export async function profile(userId: number) {
  const user = await account(userId);
  const permissions = user.role!.permissions;
  const access = Object.entries(permissionCatalog()).flatMap(([key, definition]) => {
    const level = effectiveLevel(permissions, key, definition.levels);
    return level ? [{ key, label: definition.label, level }] : [];
  });

  return {
    user: { ...publicUser(user), createdAt: user.createdAt },
    access,
  };
}

/** Дані акаунта: імʼя (email змінюється лише з підтвердженням пошти — доопрацювання AUTH) */
export async function updateAccount(userId: number, input: unknown) {
  const user = await account(userId);
  const name = String(body(input).name ?? '').trim();
  if (name.length > 80) throw new HttpError(400, 'Імʼя: до 80 символів');

  user.name = name || null;
  await user.save();
  return { user: publicUser(user) };
}

/** Налаштування: передані поля; null — скинути до типового */
export async function updatePreferences(userId: number, input: unknown) {
  const data = body(input);
  const patch: { theme?: 'light' | 'dark'; timezone?: string | null } = {};

  if (data.theme !== undefined) {
    if (!isTheme(data.theme)) throw new HttpError(400, 'Тема: light або dark');
    patch.theme = data.theme;
  }
  if (data.timezone !== undefined) {
    if (data.timezone !== null && !isTimeZone(data.timezone)) throw new HttpError(400, 'Невідомий часовий пояс');
    patch.timezone = data.timezone;
  }
  if (!Object.keys(patch).length) throw new HttpError(400, 'Немає змін');

  await UserPreference.upsert({ userId, ...patch });
  // MySQL-upsert повертає лише передані поля — перечитуємо рядок цілком
  const saved = await UserPreference.findByPk(userId);
  return { preferences: { theme: saved?.theme ?? null, timezone: saved?.timezone ?? null } };
}

/** Зміна пароля з перевіркою поточного */
export async function changePassword(userId: number, input: unknown) {
  const data = body(input);
  const user = await account(userId);
  if (!(await verifyPassword(String(data.currentPassword ?? ''), user.passwordHash))) {
    throw new HttpError(400, 'Невірний поточний пароль');
  }
  const next = readPassword(data.newPassword, 'Новий пароль: від 8 до 128 символів');
  if (await verifyPassword(next, user.passwordHash)) {
    throw new HttpError(400, 'Новий пароль збігається з поточним');
  }

  user.passwordHash = await hashPassword(next);
  await user.save();
  return { ok: true };
}

/** Видалення акаунта з підтвердженням паролем; налаштування видаляються каскадом */
export async function deleteAccount(userId: number, input: unknown) {
  const user = await account(userId);
  if (user.role!.isDeveloper) {
    throw new HttpError(403, 'Акаунт розробника не видаляється — спершу передайте роль');
  }
  if (!(await verifyPassword(String(body(input).password ?? ''), user.passwordHash))) {
    throw new HttpError(400, 'Невірний пароль');
  }
  await User.destroy({ where: { id: user.id } });
}
