import { api } from '$lib/core/api';
import type { GrantLevel, Preferences, User } from '$lib/shared/types';

export type CabinetProfile = {
  user: User & { createdAt: string };
  twoFactor: { enabled: boolean; recoveryLeft: number };
};

export type SessionItem = {
  id: number;
  /** IP входу */
  ip: string | null;
  /** IP останнього запиту */
  lastIp: string | null;
  userAgent: string | null;
  /** Вхід підтверджено кодом 2FA */
  twoFactor: boolean;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
  endedAt: string | null;
  current: boolean;
};

export type PersonalDetails = Record<
  'phone' | 'company' | 'taxId' | 'country' | 'region' | 'city' | 'address' | 'postalCode',
  string
>;

export type SshKeyItem = { id: number; title: string; type: string; fingerprint: string; createdAt: string };

export type LoyaltyTier = 'base' | 'bronze' | 'silver' | 'gold' | 'platinum';
export type Loyalty = {
  tier: LoyaltyTier;
  spent: string;
  currency: string;
  next: { tier: LoyaltyTier; remaining: string } | null;
  progress: number;
  tiers: { tier: LoyaltyTier; from: string }[];
};

export type NotificationGroupSetting = { group: 'account' | 'billing' | 'hosting' | 'referrals'; locked: boolean; enabled: boolean };

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

export type BalanceTransaction = {
  id: number;
  amount: string;
  balanceAfter: string;
  kind: 'topup' | 'charge' | 'adjustment' | 'refund';
  note: string | null;
  createdAt: string;
  user?: { id: number; email: string };
};

export type TopupMethod = 'card' | 'bank';

/** Заявка на поповнення; реквізити — поки чекає оплати */
export type Topup = {
  id: number;
  method: TopupMethod;
  amount: string;
  reference: string;
  status: 'pending' | 'paid' | 'cancelled';
  note: string | null;
  createdAt: string;
  resolvedAt: string | null;
  requisites?: Record<string, string>;
};

export type BillingSummary = { balance: string; currency: string; pendingTopups: number };
export type BillingDetails = BillingSummary & {
  minTopup: string;
  note: string | null;
  methods: Array<{ method: TopupMethod; requisites: Record<string, string> }>;
  topups: Topup[];
  transactions: BalanceTransaction[];
};

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

export const fetchSessions = () => api<{ sessions: SessionItem[]; history: SessionItem[] }>('/cabinet/sessions');
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
export const createTopup = (method: TopupMethod, amount: string) =>
  api<{ topup: Topup }>('/cabinet/billing/topups', { method: 'POST', body: { method, amount } });
export const cancelTopup = (id: number) => api(`/cabinet/billing/topups/${id}`, { method: 'DELETE' });

export const fetchDetails = () => api<{ details: PersonalDetails }>('/cabinet/details');
export const updateDetails = (patch: Partial<PersonalDetails>) =>
  api<{ details: PersonalDetails }>('/cabinet/details', { method: 'PUT', body: patch });

export const fetchSshKeys = () => api<{ keys: SshKeyItem[] }>('/cabinet/ssh-keys');
export const addSshKey = (title: string, publicKey: string) =>
  api<{ key: SshKeyItem }>('/cabinet/ssh-keys', { method: 'POST', body: { title, publicKey } });
export const removeSshKey = (id: number) => api(`/cabinet/ssh-keys/${id}`, { method: 'DELETE' });

export const fetchLoyalty = () => api<Loyalty>('/cabinet/billing/loyalty');

export const fetchNotificationSettings = () =>
  api<{ groups: NotificationGroupSetting[] }>('/cabinet/notifications/settings');
export const updateNotificationSettings = (groups: Partial<Record<NotificationGroupSetting['group'], boolean>>) =>
  api<{ groups: NotificationGroupSetting[] }>('/cabinet/notifications/settings', { method: 'PUT', body: { groups } });
