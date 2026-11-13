import { api } from '$lib/core/api';
import type { AdminUser, GrantLevel, Permissions, Role } from '$lib/shared/types';

/** Ресурс з каталогу прав (оголошують модулі API) */
export type PermissionResource = { key: string; label: string; levels: GrantLevel[] };

export type RoleInput = { slug: string; name: string; permissions: Permissions };

export type AdminOverview = {
  users: { total: number; thisMonth: number };
  roles: { total: number; custom: number };
  resources: number;
};

export function fetchOverview() {
  return api<AdminOverview>('/admin/overview');
}

export function fetchUsers() {
  return api<{ users: AdminUser[] }>('/admin/users');
}

export function fetchRoles() {
  return api<{ roles: Role[] }>('/admin/roles');
}

export function fetchPermissions() {
  return api<{ resources: PermissionResource[] }>('/admin/permissions');
}

export function patchUserRole(id: number, roleId: number) {
  return api<{ user: AdminUser }>(`/admin/users/${id}`, { method: 'PATCH', body: { roleId } });
}

export function createRole(input: RoleInput) {
  return api<{ role: Role }>('/admin/roles', { method: 'POST', body: input });
}

export function updateRole(id: number, patch: Partial<RoleInput>) {
  return api<{ role: Role }>(`/admin/roles/${id}`, { method: 'PATCH', body: patch });
}

export function deleteRole(id: number, reassignTo: number) {
  return api(`/admin/roles/${id}`, { method: 'DELETE', body: { reassignTo } });
}
