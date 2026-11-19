import type { Request } from 'express';
import { track } from '../../../flowaxy/activity/index.js';
import { hashPassword, verifyPassword } from '../../../shared/crypto/index.js';
import { HttpError } from '../../../shared/http/index.js';
import { removeAvatar, removeAvatarFile, saveAvatar } from '../avatar.js';
import { avatarUrl, publicUser, readPassword } from '../core/index.js';
import { isLanguage, isTheme, isTimeZone, UserPreference } from '../models/user-preference.js';
import { findUserWithRole, User } from '../models/user.js';
import { revokeOtherSessions, revokeSession } from '../sessions.js';
import * as twoFactor from '../two-factor.js';

type Body = Record<string, unknown>;

function body(value: unknown): Body {
  return value && typeof value === 'object' ? (value as Body) : {};
}

async function account(userId: number) {
  const user = await findUserWithRole(userId);
  if (!user?.role) throw new HttpError(401, 'Сесія недійсна');
  return user;
}

async function checkPassword(user: User, password: unknown): Promise<void> {
  if (!(await verifyPassword(String(password ?? ''), user.passwordHash))) {
    throw new HttpError(400, 'Невірний пароль');
  }
}

/** Профіль: хто я, з якою роллю, стан 2FA */
export async function profile(userId: number) {
  const user = await account(userId);
  return {
    user: { ...publicUser(user), createdAt: user.createdAt },
    twoFactor: { enabled: Boolean(user.twoFactorSecret), recoveryLeft: twoFactor.recoveryLeft(user) },
  };
}

/** Дані акаунта: імʼя (email змінюється лише з підтвердженням пошти) */
export async function updateAccount(req: Request, userId: number, input: unknown) {
  const user = await account(userId);
  const name = String(body(input).name ?? '').trim();
  if (name.length > 80) throw new HttpError(400, 'Імʼя: до 80 символів');

  user.name = name || null;
  await user.save();
  await track(req, userId, 'profile.updated');
  return { user: publicUser(user) };
}

/** Налаштування: передані поля; null — скинути до типового */
export async function updatePreferences(userId: number, input: unknown) {
  const data = body(input);
  const patch: Partial<Pick<UserPreference, 'theme' | 'timezone' | 'language' | 'antiPhishingCode'>> = {};

  if (data.theme !== undefined) {
    if (!isTheme(data.theme)) throw new HttpError(400, 'Тема: light або dark');
    patch.theme = data.theme;
  }
  if (data.timezone !== undefined) {
    if (data.timezone !== null && !isTimeZone(data.timezone)) throw new HttpError(400, 'Невідомий часовий пояс');
    patch.timezone = data.timezone;
  }
  if (data.language !== undefined) {
    if (!isLanguage(data.language)) throw new HttpError(400, 'Мова: uk, en або ru');
    patch.language = data.language;
  }
  if (data.antiPhishingCode !== undefined) {
    const code = data.antiPhishingCode === null ? '' : String(data.antiPhishingCode).trim();
    if (code.length > 32) throw new HttpError(400, 'Антифішинговий код: до 32 символів');
    patch.antiPhishingCode = code || null;
  }
  if (!Object.keys(patch).length) throw new HttpError(400, 'Немає змін');

  await UserPreference.upsert({ userId, ...patch });
  // MySQL-upsert повертає лише передані поля — перечитуємо рядок цілком
  const saved = await UserPreference.findByPk(userId);
  return {
    preferences: {
      theme: saved?.theme ?? null,
      timezone: saved?.timezone ?? null,
      language: saved?.language ?? null,
      antiPhishingCode: saved?.antiPhishingCode ?? null,
    },
  };
}

/** Зміна пароля: усі інші сесії відкликаються */
export async function changePassword(req: Request, userId: number, sessionId: number, input: unknown) {
  const data = body(input);
  const user = await account(userId);
  if (!(await verifyPassword(String(data.currentPassword ?? ''), user.passwordHash))) {
    throw new HttpError(400, 'Невірний поточний пароль');
  }
  const next = readPassword(data.newPassword, 'Новий пароль: від 8 до 128 символів');
  if (await verifyPassword(next, user.passwordHash)) throw new HttpError(400, 'Новий пароль збігається з поточним');

  user.passwordHash = await hashPassword(next);
  await user.save();
  const revoked = await revokeOtherSessions(userId, sessionId);
  await track(req, userId, 'password.changed', { revokedSessions: revoked });
  return { ok: true, revokedSessions: revoked };
}

/** Видалення акаунта з підтвердженням паролем; повʼязані рядки видаляються каскадом */
export async function deleteAccount(userId: number, input: unknown) {
  const user = await account(userId);
  if (user.role!.isDeveloper) throw new HttpError(403, 'Акаунт розробника не видаляється — спершу передайте роль');
  await checkPassword(user, body(input).password);
  const avatar = user.avatar;
  await User.destroy({ where: { id: user.id } });
  await removeAvatarFile(avatar);
}

/* ---------- Сесії (пристрої) ---------- */

export async function endSession(req: Request, userId: number, currentId: number, sessionId: number) {
  if (sessionId === currentId) throw new HttpError(400, 'Поточну сесію завершує вихід');
  if (!(await revokeSession(userId, sessionId))) throw new HttpError(404, 'Сесію не знайдено');
  await track(req, userId, 'session.revoked');
}

export async function endOtherSessions(req: Request, userId: number, currentId: number) {
  const revoked = await revokeOtherSessions(userId, currentId);
  if (revoked) await track(req, userId, 'session.revoked_all', { count: revoked });
  return { revoked };
}

/* ---------- 2FA ---------- */

export async function twoFactorSetup(userId: number) {
  return twoFactor.setup(await account(userId));
}

export async function twoFactorEnable(req: Request, userId: number, input: unknown) {
  const data = body(input);
  const result = await twoFactor.enable(await account(userId), data.secret, data.code);
  await track(req, userId, '2fa.enabled');
  return result;
}

export async function twoFactorDisable(req: Request, userId: number, input: unknown) {
  const data = body(input);
  await twoFactor.disable(await account(userId), data.password, data.code);
  await track(req, userId, '2fa.disabled');
}

/* ---------- Аватар ---------- */

export async function uploadAvatar(req: Request, userId: number, data: unknown) {
  const user = await account(userId);
  const file = await saveAvatar(user, data);
  await track(req, userId, 'avatar.updated');
  return { avatarUrl: avatarUrl(file) };
}

export async function deleteAvatar(req: Request, userId: number) {
  await removeAvatar(await account(userId));
  await track(req, userId, 'avatar.removed');
}

/* ---------- Реферали ---------- */

/** Реферальний код і запрошені (email частково приховано) */
export async function referrals(userId: number) {
  const user = await account(userId);
  const invited = await User.findAll({
    where: { referredById: userId },
    attributes: ['id', 'email', 'createdAt'],
    order: [['createdAt', 'DESC']],
  });
  return {
    code: user.referralCode,
    invited: invited.map((row) => ({
      id: row.id,
      email: row.email.replace(/^(.)(.*)(@.*)$/, (_m, first: string, rest: string, domain: string) => `${first}${'•'.repeat(Math.min(rest.length, 6))}${domain}`),
      createdAt: row.createdAt,
    })),
  };
}
