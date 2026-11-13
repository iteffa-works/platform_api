import { api } from '$lib/core/api';
import type { GrantLevel, Preferences, User } from '$lib/shared/types';

export type AccessItem = { key: string; label: string; level: GrantLevel };

export type CabinetProfile = {
  user: User & { createdAt: string };
  access: AccessItem[];
};

export function fetchProfile() {
  return api<CabinetProfile>('/cabinet/profile');
}

export function updateAccount(name: string) {
  return api<{ user: User }>('/cabinet/account', { method: 'PATCH', body: { name } });
}

export function updatePreferences(patch: Partial<Preferences>) {
  return api<{ preferences: Preferences }>('/cabinet/preferences', { method: 'PATCH', body: patch });
}

export function changePassword(currentPassword: string, newPassword: string) {
  return api('/cabinet/password', { method: 'POST', body: { currentPassword, newPassword } });
}

export function deleteAccount(password: string) {
  return api('/cabinet/account', { method: 'DELETE', body: { password } });
}
