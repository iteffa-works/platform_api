import { get, writable } from 'svelte/store';
import { can, DEVELOPER_ROLE, user } from '$lib/domain/auth';
import type { AdminUser, Permissions, Role } from '$lib/shared/types';
import { createRunner } from '$lib/shared/utils';
import * as adminApi from './api.js';
import type { AdminOverview, PermissionResource } from './api.js';

export const adminOverview = writable<AdminOverview | null>(null);
export const adminUsers = writable<AdminUser[]>([]);
export const adminRoles = writable<Role[]>([]);
export const adminResources = writable<PermissionResource[]>([]);
export const adminBusy = writable(false);
export const adminError = writable('');

const run = createRunner(adminBusy, adminError);

/** Базова роль, куди переходять користувачі видаленої ролі */
const FALLBACK_ROLE = 'user';

/** Розробник першим, далі — як віддає API */
async function fetchRoles(): Promise<void> {
  const { roles } = await adminApi.fetchRoles();
  adminRoles.set([...roles].sort((a, b) => Number(b.slug === DEVELOPER_ROLE) - Number(a.slug === DEVELOPER_ROLE)));
}

async function fetchUsers(): Promise<void> {
  adminUsers.set((await adminApi.fetchUsers()).users);
}

/** load головної: показники + (за правом) останні користувачі */
export function loadOverviewPage(): Promise<void> {
  return run(async () => {
    const [data] = await Promise.all([
      adminApi.fetchOverview(),
      can(get(user), 'users', 'view') ? fetchUsers() : Promise.resolve(),
    ]);
    adminOverview.set(data);
  }, { rethrow: true });
}

/** load сторінки користувачів: помилка прокидається далі */
export function loadUsersPage(): Promise<void> {
  return run(() => Promise.all([fetchUsers(), fetchRoles()]).then(() => undefined), { rethrow: true });
}

/** load сторінки ролей */
export function loadRolesPage(): Promise<void> {
  return run(async () => {
    const [{ resources }] = await Promise.all([adminApi.fetchPermissions(), fetchRoles()]);
    adminResources.set(resources);
  }, { rethrow: true });
}

export function changeUserRole(id: number, roleId: number): Promise<void> {
  return run(async () => {
    await adminApi.patchUserRole(id, roleId);
    await Promise.all([fetchUsers(), fetchRoles()]);
  });
}

export function createRole(slug: string, name: string): Promise<void> {
  return run(async () => {
    await adminApi.createRole({ slug, name, permissions: {} });
    await fetchRoles();
  });
}

export function saveRolePermissions(id: number, permissions: Permissions): Promise<void> {
  return run(async () => {
    await adminApi.updateRole(id, { permissions });
    await fetchRoles();
  });
}

export function removeRole(role: Role): Promise<void> {
  const fallback = get(adminRoles).find((item) => item.slug === FALLBACK_ROLE);
  const note = role.users && fallback ? ` Її користувачі (${role.users}) перейдуть у роль «${fallback.name}».` : '';
  if (!fallback || !confirm(`Видалити роль «${role.name}»?${note}`)) return Promise.resolve();
  return run(async () => {
    await adminApi.deleteRole(role.id, fallback.id);
    await fetchRoles();
  });
}
