import type { GrantLevel, User } from '$lib/shared/types';

const LEVELS = ['none', 'view', 'edit', 'manage'] as const;

/** Підписи рівнів для UI */
export const LEVEL_LABELS: Record<GrantLevel | 'none', string> = {
  none: 'Немає',
  view: 'Перегляд',
  edit: 'Редагування',
  manage: 'Керування',
};

/** Розробник: роль з усіма правами */
export const DEVELOPER_ROLE = 'developer';

/** Чи має користувач рівень `level` на ресурс (дзеркало серверного can) */
export function can(user: User | null | undefined, resource: string, level: GrantLevel): boolean {
  if (!user) return false;
  if (user.permissions['*']) return true;
  return LEVELS.indexOf(user.permissions[resource] ?? 'none') >= LEVELS.indexOf(level);
}
