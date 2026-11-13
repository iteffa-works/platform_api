import { parsePermissions, type Permissions } from '../../core/access/index.js';
import { HttpError } from '../../shared/http/index.js';

type Body = Record<string, unknown>;

function body(value: unknown): Body {
  return value && typeof value === 'object' ? (value as Body) : {};
}

function readString(value: unknown, field: string, min: number, max: number): string {
  const text = String(value ?? '').trim();
  if (text.length < min || text.length > max) {
    throw new HttpError(400, `${field}: ${min}–${max} символів`);
  }
  return text;
}

export function readRoleId(value: unknown): string {
  const roleId = body(value).roleId;
  if (typeof roleId !== 'string' || !roleId) throw new HttpError(400, 'Не вказано roleId');
  return roleId;
}

export type RoleInput = {
  slug?: string;
  name?: string;
  description?: string | null;
  permissions?: Permissions;
};

export type NewRoleInput = RoleInput & { slug: string; name: string; permissions: Permissions };

function readSlug(value: unknown): string {
  const slug = String(value ?? '').trim();
  if (!/^[a-z][a-z0-9-]{1,31}$/.test(slug)) {
    throw new HttpError(400, 'Ключ ролі: 2–32 символи, латиниця в нижньому регістрі, цифри, дефіс');
  }
  return slug;
}

function readPermissions(value: unknown): Permissions {
  try {
    return parsePermissions(value ?? {});
  } catch (error) {
    throw new HttpError(400, (error as Error).message);
  }
}

function readDescription(value: unknown): string | null {
  if (value === null) return null;
  return readString(value, 'Опис', 0, 255) || null;
}

/** Нова роль (POST) */
export function readNewRole(value: unknown): NewRoleInput {
  const data = body(value);
  return {
    slug: readSlug(data.slug),
    name: readString(data.name, 'Назва ролі', 1, 80),
    description: data.description === undefined ? null : readDescription(data.description),
    permissions: readPermissions(data.permissions),
  };
}

/** Зміни ролі (PATCH): лише передані поля */
export function readRolePatch(value: unknown): RoleInput {
  const data = body(value);
  const input: RoleInput = {};
  if (data.slug !== undefined) input.slug = readSlug(data.slug);
  if (data.name !== undefined) input.name = readString(data.name, 'Назва ролі', 1, 80);
  if (data.description !== undefined) input.description = readDescription(data.description);
  if (data.permissions !== undefined) input.permissions = readPermissions(data.permissions);
  return input;
}
