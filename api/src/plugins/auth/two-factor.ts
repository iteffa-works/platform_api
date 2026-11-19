import { randomBytes } from 'node:crypto';
import QRCode from 'qrcode';
import { APP_TITLE } from '../../config/index.js';
import { decrypt, encrypt, readPayload, sha256, signPayload, verifyPassword } from '../../shared/crypto/index.js';
import { generateSecret, otpauthUrl, verifyTotp } from '../../shared/crypto/totp.js';
import { HttpError } from '../../shared/http/index.js';
import type { User } from './models/user.js';

/**
 * Двофакторна автентифікація (TOTP) + одноразові коди відновлення.
 * Секрет зберігається зашифрованим (AES-GCM, ключ з APP_SECRET), коди — як SHA-256.
 */

const TICKET_TTL_MS = 5 * 60_000;
const RECOVERY_COUNT = 8;

type Ticket = { uid: number; purpose: '2fa' };

/** Тікет між кроками входу: пароль прийнято, чекаємо код */
export function issueTicket(userId: number): string {
  return signPayload({ uid: userId, purpose: '2fa' } satisfies Ticket, TICKET_TTL_MS);
}

export function readTicket(ticket: unknown): number {
  const payload = readPayload<Ticket>(String(ticket ?? ''));
  if (!payload || payload.purpose !== '2fa') throw new HttpError(400, 'Сесія входу застаріла, увійдіть знову');
  return payload.uid;
}

/** Новий секрет і QR для підключення застосунку (ще не збережено) */
export async function setup(user: User) {
  if (user.twoFactorSecret) throw new HttpError(400, '2FA вже увімкнено');
  const secret = generateSecret();
  const url = otpauthUrl(secret, user.email, APP_TITLE);
  return { secret, otpauthUrl: url, qr: await QRCode.toDataURL(url, { margin: 1, width: 220 }) };
}

function recoveryCodes(): string[] {
  return Array.from({ length: RECOVERY_COUNT }, () => {
    const raw = randomBytes(5).toString('hex');
    return `${raw.slice(0, 5)}-${raw.slice(5)}`;
  });
}

/** Увімкнути: секрет із кроку setup + перший код із застосунку */
export async function enable(user: User, secret: unknown, code: unknown) {
  if (user.twoFactorSecret) throw new HttpError(400, '2FA вже увімкнено');
  if (typeof secret !== 'string' || !/^[A-Z2-7]{32}$/.test(secret)) throw new HttpError(400, 'Некоректний секрет 2FA');
  if (!verifyTotp(secret, String(code ?? ''))) throw new HttpError(400, 'Невірний код 2FA');

  const codes = recoveryCodes();
  user.twoFactorSecret = encrypt(secret);
  user.twoFactorRecovery = JSON.stringify(codes.map(sha256));
  await user.save();
  return { recoveryCodes: codes };
}

/**
 * Перевірити код входу: TOTP або одноразовий код відновлення (витрачається).
 * true — код прийнято.
 */
export async function verifyCode(user: User, code: unknown): Promise<boolean> {
  if (!user.twoFactorSecret) return false;
  const value = String(code ?? '').trim();
  if (verifyTotp(decrypt(user.twoFactorSecret), value)) return true;

  const hashes = JSON.parse(user.twoFactorRecovery || '[]') as string[];
  const hash = sha256(value.toLowerCase());
  if (!hashes.includes(hash)) return false;
  user.twoFactorRecovery = JSON.stringify(hashes.filter((item) => item !== hash));
  await user.save();
  return true;
}

/** Вимкнути: пароль + код (TOTP або відновлення) */
export async function disable(user: User, password: unknown, code: unknown) {
  if (!user.twoFactorSecret) throw new HttpError(400, '2FA не увімкнено');
  if (!(await verifyPassword(String(password ?? ''), user.passwordHash))) throw new HttpError(400, 'Невірний пароль');
  if (!(await verifyCode(user, code))) throw new HttpError(400, 'Невірний код 2FA');
  user.twoFactorSecret = null;
  user.twoFactorRecovery = null;
  await user.save();
}

/** Скільки кодів відновлення лишилось */
export function recoveryLeft(user: User): number {
  return (JSON.parse(user.twoFactorRecovery || '[]') as string[]).length;
}
