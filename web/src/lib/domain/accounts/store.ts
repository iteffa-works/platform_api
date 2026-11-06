import { get, writable } from 'svelte/store';
import type { Account } from '$lib/shared/types';
import * as accountsApi from './api.js';

export const accounts = writable<Account[]>([]);
export const selectedAccountId = writable('');
export const accountsBusy = writable(false);
export const accountsError = writable('');

function pickAccount(list: Account[]): string {
  return list.find((item) => item.isActive)?.id || list[0]?.id || '';
}

export async function loadAccounts(): Promise<Account[]> {
  const data = await accountsApi.fetchAccounts();
  accounts.set(data.accounts);
  const current = get(selectedAccountId);
  if (!current || !data.accounts.some((item) => item.id === current)) {
    selectedAccountId.set(pickAccount(data.accounts));
  }
  return data.accounts;
}

async function run(action: () => Promise<void>): Promise<void> {
  accountsError.set('');
  accountsBusy.set(true);
  try {
    await action();
  } catch (err) {
    accountsError.set(err instanceof Error ? err.message : 'Помилка');
  } finally {
    accountsBusy.set(false);
  }
}

export function addAccount(label: string, apiId: number, apiHash: string) {
  return run(async () => {
    await accountsApi.createAccount(label, apiId, apiHash);
    await loadAccounts();
  });
}

export function activateAccount(id: string) {
  return run(async () => {
    await accountsApi.patchAccount(id, { isActive: true });
    await loadAccounts();
  });
}

export function removeAccount(id: string) {
  if (!confirm('Видалити акаунт?')) return Promise.resolve();
  return run(async () => {
    await accountsApi.deleteAccount(id);
    await loadAccounts();
  });
}
