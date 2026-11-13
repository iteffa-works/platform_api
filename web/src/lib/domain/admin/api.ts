import { api } from '$lib/core/api';
import type { AdminUser, Role } from '$lib/shared/types';

export function fetchUsers() {
  return api<{ users: AdminUser[] }>('/admin/users');
}

export function fetchRoles() {
  return api<{ roles: Role[] }>('/admin/roles');
}

export function patchUserRole(id: string, roleId: string) {
  return api<{ user: AdminUser }>(`/admin/users/${id}`, {
    method: 'PATCH',
    body: { roleId },
  });
}
