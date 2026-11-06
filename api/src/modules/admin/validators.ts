import { HttpError } from '../../shared/http/index.js';
import type { UserRole } from '../auth/models/user.js';

/** Валідація ролі з тіла запиту */
export function readRole(body: unknown): UserRole {
  const role = String((body as { role?: unknown } | null)?.role || '');
  if (role !== 'user' && role !== 'admin') throw new HttpError(400, 'Некоректна роль');
  return role;
}
