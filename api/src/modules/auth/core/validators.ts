import { HttpError } from '../../../shared/http/index.js';

/** Валідація email і пароля */
export function readCredentials(body: unknown) {
  const data = (body ?? {}) as { email?: unknown; password?: unknown };
  const email = String(data.email || '').trim().toLowerCase();
  const password = String(data.password || '');

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    throw new HttpError(400, 'Некоректний email');
  }
  if (password.length < 8 || password.length > 128) {
    throw new HttpError(400, 'Пароль має бути від 8 до 128 символів');
  }

  return { email, password };
}
