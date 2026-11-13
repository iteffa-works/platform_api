import { HttpError } from '../../shared/http/index.js';
import { isUserRole, type UserRole } from '../auth/models/user.js';

/** Валідація ролі з тіла запиту */
export function readRole(body: unknown): UserRole {
  const role = (body as { role?: unknown } | null)?.role;
  if (!isUserRole(role)) throw new HttpError(400, 'Некоректна роль');
  return role;
}
