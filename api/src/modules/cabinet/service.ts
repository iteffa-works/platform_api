import { effectiveLevel, permissionCatalog } from '../../core/access/index.js';
import { HttpError } from '../../shared/http/index.js';
import { publicUser } from '../auth/core/index.js';
import { findUserWithRole } from '../auth/models/user.js';

/** Профіль: хто я, з якою роллю і що мені доступно (за каталогом ресурсів) */
export async function profile(userId: number) {
  const user = await findUserWithRole(userId);
  if (!user?.role) throw new HttpError(401, 'Сесія недійсна');

  const permissions = user.role.permissions;
  const access = Object.entries(permissionCatalog()).flatMap(([key, definition]) => {
    const level = effectiveLevel(permissions, key, definition.levels);
    return level ? [{ key, label: definition.label, level }] : [];
  });

  return {
    user: { ...publicUser(user), createdAt: user.createdAt },
    access,
  };
}
