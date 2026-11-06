import { api } from '$lib/core/api';
import type { User } from '$lib/shared/types';

/** Список користувачів (admin) */
export function fetchUsers() {
  return api<{ users: User[] }>('/admin/users');
}

/** Зміна ролі користувача */
export function patchUserRole(id: string, role: User['role']) {
  return api<{ user: User }>(`/admin/users/${id}`, {
    method: 'PATCH',
    body: { role },
  });
}
