/**
 * Рівні прав і каталог ресурсів.
 * Ресурси оголошують модулі (`plugin.permissions`), ролі зберігаються в БД
 * як мапа «ресурс → рівень». Код знає лише ресурси, не ролі.
 */

export const LEVELS = ['none', 'view', 'edit', 'manage'] as const;
export type PermissionLevel = (typeof LEVELS)[number];

/** Рівень, який реально можна видати (`none` = відсутність ключа) */
export type GrantLevel = Exclude<PermissionLevel, 'none'>;

/** Права ролі: ресурс → рівень; `*` = усі ресурси (лише developer) */
export type Permissions = Record<string, GrantLevel>;

export const ALL = '*';

export type ResourceDefinition = {
  label: string;
  /** Дозволені рівні для ресурсу (за зростанням) */
  levels: readonly GrantLevel[];
};

export type PermissionCatalog = Record<string, ResourceDefinition>;

const catalog: PermissionCatalog = {};

export function isLevel(value: unknown): value is PermissionLevel {
  return LEVELS.includes(value as PermissionLevel);
}

function rank(level: PermissionLevel | undefined): number {
  return LEVELS.indexOf(level ?? 'none');
}

/** Оголосити ресурси модуля (викликає loader плагінів) */
export function registerResources(resources: PermissionCatalog): void {
  for (const [key, definition] of Object.entries(resources)) {
    if (key === ALL) throw new Error('Ресурс «*» зарезервовано');
    if (catalog[key]) throw new Error(`Ресурс «${key}» уже оголошено`);
    catalog[key] = definition;
  }
}

export function permissionCatalog(): Readonly<PermissionCatalog> {
  return catalog;
}

/** Чи має набір прав рівень `level` на ресурс */
export function can(permissions: Permissions, resource: string, level: GrantLevel): boolean {
  if (permissions[ALL]) return true;
  return rank(permissions[resource]) >= rank(level);
}

/** Чи всі права `granted` не перевищують права `actor` (захист від ескалації) */
export function isWithin(granted: Permissions, actor: Permissions): boolean {
  if (actor[ALL]) return true;
  if (granted[ALL]) return false;
  return Object.entries(granted).every(([resource, level]) => can(actor, resource, level));
}

/**
 * Нормалізувати права з запиту за каталогом.
 * Невідомий ресурс або рівень, не дозволений ресурсу, — помилка; `none` відкидається.
 */
export function parsePermissions(input: unknown, source: PermissionCatalog = catalog): Permissions {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('Права мають бути обʼєктом «ресурс → рівень»');
  }

  const result: Permissions = {};
  for (const [resource, level] of Object.entries(input)) {
    const definition = source[resource];
    if (!definition) throw new TypeError(`Невідомий ресурс «${resource}»`);
    if (level === 'none') continue;
    if (!definition.levels.includes(level as GrantLevel)) {
      throw new TypeError(`Рівень «${String(level)}» недоступний для «${resource}»`);
    }
    result[resource] = level as GrantLevel;
  }
  return result;
}
