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

/* ---------- Журнал і білінг ---------- */

export type { ActivityEntry, BalanceTransaction, Plan } from '../cabinet/api.js';
import type { ActivityEntry, BalanceTransaction, Plan } from '../cabinet/api.js';

export function fetchActivity(userId?: number) {
  return api<{ entries: ActivityEntry[] }>(`/admin/activity${userId ? `?userId=${userId}` : ''}`);
}

export function fetchBillingAdmin() {
  return api<{ currency: string; plans: Plan[]; transactions: BalanceTransaction[] }>('/admin/billing');
}

export function adjustBalance(email: string, amount: string, note: string) {
  return api('/admin/billing/adjust', { method: 'POST', body: { email, amount, note } });
}

export type PlanInput = { slug?: string; name?: string; description?: string; price?: string; isActive?: boolean; sortOrder?: number };

export function createPlan(input: PlanInput) {
  return api<{ plan: Plan }>('/admin/billing/plans', { method: 'POST', body: input });
}

export function updatePlan(id: number, input: PlanInput) {
  return api<{ plan: Plan }>(`/admin/billing/plans/${id}`, { method: 'PATCH', body: input });
}

export function deletePlan(id: number) {
  return api(`/admin/billing/plans/${id}`, { method: 'DELETE' });
}

/* ---------- Плагіни ---------- */

export type PluginInfo = {
  name: string;
  title: string;
  description: string | null;
  version: string | null;
  kind: 'core' | 'addon';
  enabled: boolean;
};

export function fetchPlugins() {
  return api<{ plugins: PluginInfo[] }>('/admin/plugins');
}

export function setPluginEnabled(name: string, enabled: boolean) {
  return api<{ plugin: PluginInfo }>(`/admin/plugins/${encodeURIComponent(name)}`, { method: 'PATCH', body: { enabled } });
}
