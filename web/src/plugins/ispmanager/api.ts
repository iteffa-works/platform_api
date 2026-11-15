import { api } from '$lib/core/api';

export type IspServer = {
  id: number;
  name: string;
  url: string;
  username: string;
  verifyTls: boolean;
  isActive: boolean;
  defaultPreset: string | null;
  accounts: number;
};

export type ServerInput = {
  name?: string;
  url?: string;
  username?: string;
  password?: string;
  verifyTls?: boolean;
  isActive?: boolean;
  defaultPreset?: string;
};

export type AccountStatus = 'active' | 'suspended';

export type IspAccount = {
  id: number;
  panelUser: string;
  preset: string | null;
  status: AccountStatus;
  createdAt: string;
  server: { id: number; name: string; url: string } | null;
  user?: { id: number; email: string };
};

export type PanelUser = { name: string; fullname: string | null; preset: string | null; suspended: boolean; linked: boolean };

export type AccountInput = {
  mode: 'create' | 'link';
  serverId: number;
  email: string;
  panelUser: string;
  preset?: string;
  password?: string;
};

export type Site = { name: string; docroot: string | null; ssl: boolean; active: boolean };

const ADMIN = '/admin/ispmanager';

/* ---------- Адмінка ---------- */

export function fetchServers() {
  return api<{ servers: IspServer[] }>(`${ADMIN}/servers`);
}

export function createServer(input: ServerInput) {
  return api<{ server: IspServer }>(`${ADMIN}/servers`, { method: 'POST', body: input });
}

export function updateServer(id: number, input: ServerInput) {
  return api<{ server: IspServer }>(`${ADMIN}/servers/${id}`, { method: 'PATCH', body: input });
}

export function deleteServer(id: number) {
  return api(`${ADMIN}/servers/${id}`, { method: 'DELETE' });
}

export function checkServer(id: number) {
  return api<{ ok: true; users: number; presets: number } | { ok: false; error: string }>(`${ADMIN}/servers/${id}/check`, { method: 'POST' });
}

export function fetchPresets(serverId: number) {
  return api<{ presets: string[] }>(`${ADMIN}/servers/${serverId}/presets`);
}

export function fetchPanelUsers(serverId: number) {
  return api<{ users: PanelUser[] }>(`${ADMIN}/servers/${serverId}/users`);
}

export function fetchAccounts() {
  return api<{ accounts: IspAccount[] }>(`${ADMIN}/accounts`);
}

export function createAccount(input: AccountInput) {
  return api<{ account: IspAccount; password: string | null }>(`${ADMIN}/accounts`, { method: 'POST', body: input });
}

export function setAccountStatus(id: number, action: 'suspend' | 'resume') {
  return api<{ account: IspAccount }>(`${ADMIN}/accounts/${id}/${action}`, { method: 'POST' });
}

export function deleteAccount(id: number, removeFromPanel: boolean) {
  return api(`${ADMIN}/accounts/${id}`, { method: 'DELETE', body: { removeFromPanel } });
}

/* ---------- Кабінет ---------- */

export function fetchMyHosting() {
  return api<{ accounts: IspAccount[] }>('/cabinet/hosting');
}

export function fetchSites(id: number) {
  return api<{ sites: Site[] }>(`/cabinet/hosting/${id}/sites`);
}

export function panelLogin(id: number) {
  return api<{ url: string }>(`/cabinet/hosting/${id}/login`, { method: 'POST' });
}

export function changePanelPassword(id: number, password: string) {
  return api(`/cabinet/hosting/${id}/password`, { method: 'POST', body: { password } });
}
