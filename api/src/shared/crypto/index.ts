import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../../config/index.js';

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

/** JWT: `sub` — id користувача (рядком, як вимагає специфікація) */
export function signToken(userId: number): string {
  return jwt.sign({ sub: String(userId) }, config.secret, { expiresIn: config.jwtExpires });
}

export function readToken(token: string): { userId: number } {
  const payload = jwt.verify(token, config.secret);
  const userId = typeof payload === 'string' ? NaN : Number(payload.sub);
  if (!Number.isSafeInteger(userId) || userId <= 0) throw new Error('Недійсний токен');
  return { userId };
}
