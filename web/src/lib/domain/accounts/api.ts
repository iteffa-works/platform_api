import { api } from '$lib/core/api';
import type { Account } from '$lib/shared/types';

export function fetchAccounts() {
  return api<{ accounts: Account[] }>('/accounts');
}

export function createAccount(label: string, apiId: number, apiHash: string) {
  return api('/accounts', { method: 'POST', body: { label, apiId, apiHash } });
}

export function patchAccount(id: string, body: Record<string, unknown>) {
  return api(`/accounts/${id}`, { method: 'PATCH', body });
}

export function deleteAccount(id: string) {
  return api(`/accounts/${id}`, { method: 'DELETE' });
}
