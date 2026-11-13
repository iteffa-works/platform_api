import { col, fn } from 'sequelize';
import { isWithin, LEVELS, permissionCatalog, type Permissions } from '../../core/access/index.js';
import { sequelize } from '../../core/db/index.js';
import { HttpError } from '../../shared/http/index.js';
import { DEVELOPER_ROLE, Role } from '../auth/models/role.js';
import { User } from '../auth/models/user.js';
import type { NewRoleInput, RoleInput } from './validators.js';

function present(role: Role, users = 0) {
  return {
    id: role.id,
    slug: role.slug,
    name: role.name,
    description: role.description,
    isSystem: role.isSystem,
    permissions: role.permissions,
    users,
  };
}

function assertWithin(permissions: Permissions, actor: Permissions): void {
  if (!isWithin(permissions, actor)) {
    throw new HttpError(403, 'Не можна керувати правами вищими за власні');
  }
}

async function assertSlugFree(slug: string): Promise<void> {
  if (await Role.findOne({ where: { slug } })) {
    throw new HttpError(409, 'Роль з таким ключем уже існує');
  }
}

/** Роль, яку можна змінювати (усі, крім розробника) */
async function findEditable(id: string): Promise<Role> {
  const role = await Role.findByPk(id);
  if (!role) throw new HttpError(404, 'Роль не знайдено');
  if (role.isDeveloper) throw new HttpError(403, 'Роль розробника незмінна');
  return role;
}

/** Каталог ресурсів і рівнів — основа матриці прав в адмінці */
export function listPermissions() {
  return {
    levels: LEVELS,
    resources: Object.entries(permissionCatalog()).map(([key, definition]) => ({ key, ...definition })),
  };
}

export async function listRoles() {
  const [roles, counts] = await Promise.all([
    Role.findAll({ order: [['isSystem', 'DESC'], ['name', 'ASC']] }),
    User.findAll({
      attributes: ['roleId', [fn('COUNT', col('id')), 'total']],
      group: ['roleId'],
      raw: true,
    }) as unknown as Promise<Array<{ roleId: string; total: number | string }>>,
  ]);
  const usersByRole = new Map(counts.map((row) => [row.roleId, Number(row.total)]));
  return { roles: roles.map((role) => present(role, usersByRole.get(role.id) ?? 0)) };
}

export async function createRole(input: NewRoleInput, actor: Permissions) {
  assertWithin(input.permissions, actor);
  await assertSlugFree(input.slug);
  const role = await Role.create({
    slug: input.slug,
    name: input.name,
    description: input.description ?? null,
    permissions: input.permissions,
  });
  return { role: present(role) };
}

/** Зміна ролі: стара й нова версія прав мають бути в межах прав актора */
export async function updateRole(id: string, input: RoleInput, actor: Permissions) {
  const role = await findEditable(id);
  assertWithin(role.permissions, actor);
  if (input.permissions) assertWithin(input.permissions, actor);

  if (input.slug && input.slug !== role.slug) {
    if (role.isSystem) throw new HttpError(400, 'Ключ системної ролі незмінний');
    await assertSlugFree(input.slug);
    role.slug = input.slug;
  }
  if (input.name !== undefined) role.name = input.name;
  if (input.description !== undefined) role.description = input.description;
  if (input.permissions) role.permissions = input.permissions;

  await role.save();
  return { role: present(role) };
}

/** Видалення ролі; її користувачі переходять на `reassignTo` */
export async function deleteRole(id: string, reassignTo: unknown, actor: Permissions) {
  const role = await findEditable(id);
  if (role.isSystem) throw new HttpError(400, 'Системну роль не можна видалити');
  assertWithin(role.permissions, actor);

  await sequelize.transaction(async (transaction) => {
    const users = await User.count({ where: { roleId: role.id }, transaction });
    if (users > 0) {
      if (typeof reassignTo !== 'string' || reassignTo === role.id) {
        throw new HttpError(400, 'Роль має користувачів — вкажіть reassignTo');
      }
      const target = await Role.findByPk(reassignTo, { transaction });
      if (!target) throw new HttpError(404, 'Роль для переназначення не знайдено');
      if (target.isDeveloper) throw new HttpError(403, 'Роль розробника не призначається');
      assertWithin(target.permissions, actor);
      await User.update({ roleId: target.id }, { where: { roleId: role.id }, transaction });
    }
    await role.destroy({ transaction });
  });
}
