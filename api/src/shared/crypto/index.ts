import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../../config/index.js';

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, config.secret, { expiresIn: config.jwtExpires });
}

export function readToken(token: string): { sub: string } {
  const payload = jwt.verify(token, config.secret);
  if (typeof payload === 'string' || typeof payload.sub !== 'string') {
    throw new Error('Недійсний токен');
  }
  return { sub: payload.sub };
}
