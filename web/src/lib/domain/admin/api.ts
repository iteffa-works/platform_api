import { api } from '$lib/core/api';
import type { User } from '$lib/shared/types';

export function fetchUsers() {
  return api<{ users: User[] }>('/admin/users');
}

export function patchUserRole(id: string, role: User['role']) {
  return api<{ user: User }>(`/admin/users/${id}`, {
    method: 'PATCH',
    body: { role },
  });
}
