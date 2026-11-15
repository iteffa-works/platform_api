import { api } from '$lib/core/api';
import type { GrantLevel, Preferences, User } from '$lib/shared/types';

export type AccessItem = { key: string; label: string; level: GrantLevel };

export type CabinetProfile = {
  user: User & { createdAt: string };
  access: AccessItem[];
  twoFactor: { enabled: boolean; recoveryLeft: number };
};

export type SessionItem = {
  id: number;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
  lastSeenAt: string;
  current: boolean;
};

export type ActivityEntry = {
  id: number;
  action: string;
  ip: string | null;
  userAgent: string | null;
  meta: Record<string, string | number> | null;
  createdAt: string;
  user?: { id: number; email: string };
};

export type NotificationItem = {
  id: number;
  kind: string;
  params: Record<string, string | number>;
  read: boolean;
  createdAt: string;
};

export type Plan = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  price: string;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
};

export type BalanceTransaction = {
  id: number;
  amount: string;
  balanceAfter: string;
  kind: 'topup' | 'charge' | 'adjustment' | 'refund';
  note: string | null;
  createdAt: string;
  user?: { id: number; email: string };
};

export type BillingSummary = { balance: string; currency: string; plan: Plan | null };
export type BillingDetails = BillingSummary & { plans: Plan[]; transactions: BalanceTransaction[] };

export const fetchProfile = () => api<CabinetProfile>('/cabinet/profile');

export const updateAccount = (name: string) =>
  api<{ user: User }>('/cabinet/account', { method: 'PATCH', body: { name } });

export const updatePreferences = (patch: Partial<Preferences>) =>
  api<{ preferences: Preferences }>('/cabinet/preferences', { method: 'PATCH', body: patch });

export const changePassword = (currentPassword: string, newPassword: string) =>
  api<{ revokedSessions: number }>('/cabinet/password', { method: 'POST', body: { currentPassword, newPassword } });

export const deleteAccount = (password: string) =>
  api('/cabinet/account', { method: 'DELETE', body: { password } });

export const uploadAvatar = (file: Blob) =>
  api<{ avatarUrl: string }>('/cabinet/avatar', { method: 'PUT', raw: file });

export const removeAvatar = () => api('/cabinet/avatar', { method: 'DELETE' });

export const fetchSessions = () => api<{ sessions: SessionItem[] }>('/cabinet/sessions');
export const endSession = (id: number) => api(`/cabinet/sessions/${id}`, { method: 'DELETE' });
export const endOtherSessions = () => api<{ revoked: number }>('/cabinet/sessions', { method: 'DELETE' });

export const twoFactorSetup = () =>
  api<{ secret: string; otpauthUrl: string; qr: string }>('/cabinet/2fa/setup', { method: 'POST' });
export const twoFactorEnable = (secret: string, code: string) =>
  api<{ recoveryCodes: string[] }>('/cabinet/2fa/enable', { method: 'POST', body: { secret, code } });
export const twoFactorDisable = (password: string, code: string) =>
  api('/cabinet/2fa/disable', { method: 'POST', body: { password, code } });

export const fetchReferrals = () =>
  api<{ code: string; invited: { id: number; email: string; createdAt: string }[] }>('/cabinet/referrals');

export const fetchActivity = () => api<{ entries: ActivityEntry[] }>('/cabinet/activity');

export const fetchNotifications = () =>
  api<{ notifications: NotificationItem[]; unread: number }>('/cabinet/notifications');
export const markNotificationsRead = (ids?: number[]) =>
  api('/cabinet/notifications/read', { method: 'POST', body: ids ? { ids } : {} });

export const fetchBillingSummary = () => api<BillingSummary>('/cabinet/billing/summary');
export const fetchBilling = () => api<BillingDetails>('/cabinet/billing');
export const choosePlan = (planId: number) =>
  api<BillingSummary>('/cabinet/billing/plan', { method: 'POST', body: { planId } });
