import { writable } from 'svelte/store';
import type { User } from '$lib/shared/types';
import { createRunner } from '$lib/shared/utils';
import * as adminApi from './api.js';

export const adminUsers = writable<User[]>([]);
export const adminBusy = writable(false);
export const adminError = writable('');

const run = createRunner(adminBusy, adminError);

async function fetchUsers(): Promise<void> {
  const data = await adminApi.fetchUsers();
  adminUsers.set(data.users);
}

/** Для load сторінки: помилка прокидається далі */
export function loadAdminUsers(): Promise<void> {
  return run(fetchUsers, { rethrow: true });
}

export function changeUserRole(id: string, role: User['role']): Promise<void> {
  return run(async () => {
    await adminApi.patchUserRole(id, role);
    await fetchUsers();
  });
}
