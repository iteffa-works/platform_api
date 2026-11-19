import { HttpError } from '../../../shared/http/index.js';

/** Правило пароля — спільне для реєстрації і зміни пароля */
export function readPassword(value: unknown, message = 'Пароль має бути від 8 до 128 символів'): string {
  const password = String(value ?? '');
  if (password.length < 8 || password.length > 128) throw new HttpError(400, message);
  return password;
}

/** Валідація email і пароля */
export function readCredentials(body: unknown) {
  const data = (body ?? {}) as { email?: unknown; password?: unknown };
  const email = String(data.email || '').trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    throw new HttpError(400, 'Некоректний email');
  }

  return { email, password: readPassword(data.password) };
}
