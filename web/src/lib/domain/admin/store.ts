import { writable } from 'svelte/store';
import type { User } from '$lib/shared/types';
import * as adminApi from './api.js';

export const adminUsers = writable<User[]>([]);
export const adminBusy = writable(false);
export const adminError = writable('');

export async function loadAdminUsers(): Promise<void> {
  adminError.set('');
  adminBusy.set(true);
  try {
    const data = await adminApi.fetchUsers();
    adminUsers.set(data.users);
  } catch (err) {
    adminError.set(err instanceof Error ? err.message : 'Помилка');
    throw err;
  } finally {
    adminBusy.set(false);
  }
}

export async function changeUserRole(id: string, role: User['role']): Promise<void> {
  adminError.set('');
  adminBusy.set(true);
  try {
    await adminApi.patchUserRole(id, role);
    await loadAdminUsers();
  } catch (err) {
    adminError.set(err instanceof Error ? err.message : 'Помилка');
  } finally {
    adminBusy.set(false);
  }
}
