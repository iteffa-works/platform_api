import { writable } from 'svelte/store';
import type { AdminUser, Role } from '$lib/shared/types';
import { createRunner } from '$lib/shared/utils';
import * as adminApi from './api.js';

export const adminUsers = writable<AdminUser[]>([]);
export const adminRoles = writable<Role[]>([]);
export const adminBusy = writable(false);
export const adminError = writable('');

const run = createRunner(adminBusy, adminError);

async function fetchAll(): Promise<void> {
  const [users, roles] = await Promise.all([adminApi.fetchUsers(), adminApi.fetchRoles()]);
  adminUsers.set(users.users);
  adminRoles.set(roles.roles);
}

/** Для load сторінки: помилка прокидається далі */
export function loadAdminUsers(): Promise<void> {
  return run(fetchAll, { rethrow: true });
}

export function changeUserRole(id: string, roleId: string): Promise<void> {
  return run(async () => {
    await adminApi.patchUserRole(id, roleId);
    await fetchAll();
  });
}
