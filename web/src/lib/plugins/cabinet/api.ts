import { api } from '$lib/core/api';
import type { GrantLevel, User } from '$lib/shared/types';

export type AccessItem = { key: string; label: string; level: GrantLevel };

export type CabinetProfile = {
  user: User & { createdAt: string };
  access: AccessItem[];
};

export function fetchProfile() {
  return api<CabinetProfile>('/cabinet/profile');
}
