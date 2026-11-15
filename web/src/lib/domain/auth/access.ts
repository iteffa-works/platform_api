import type { GrantLevel, User } from '$lib/shared/types';

const LEVELS = ['none', 'view', 'edit', 'manage'] as const;

/** Ключі перекладів рівнів (`$t(LEVEL_KEYS[level])`) */
export const LEVEL_KEYS = {
  none: 'level.none',
  view: 'level.view',
  edit: 'level.edit',
  manage: 'level.manage',
} as const satisfies Record<GrantLevel | 'none', string>;

/** Розробник: роль з усіма правами */
export const DEVELOPER_ROLE = 'developer';

/** Чи має користувач рівень `level` на ресурс (дзеркало серверного can) */
export function can(user: User | null | undefined, resource: string, level: GrantLevel): boolean {
  if (!user) return false;
  if (user.permissions['*']) return true;
  return LEVELS.indexOf(user.permissions[resource] ?? 'none') >= LEVELS.indexOf(level);
}
