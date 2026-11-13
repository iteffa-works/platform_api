import type { GrantLevel, User } from '$lib/shared/types';

const LEVELS = ['none', 'view', 'edit', 'manage'] as const;

/** Розробник: роль з усіма правами */
export const DEVELOPER_ROLE = 'developer';

/** Чи має користувач рівень `level` на ресурс (дзеркало серверного can) */
export function can(user: User | null | undefined, resource: string, level: GrantLevel): boolean {
  if (!user) return false;
  if (user.permissions['*']) return true;
  return LEVELS.indexOf(user.permissions[resource] ?? 'none') >= LEVELS.indexOf(level);
}
