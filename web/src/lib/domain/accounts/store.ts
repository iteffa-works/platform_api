import { writable } from 'svelte/store';
import type { Account } from '$lib/shared/types';
import { createRunner } from '$lib/shared/utils';
import * as accountsApi from './api.js';

export const accounts = writable<Account[]>([]);
export const accountsBusy = writable(false);
export const accountsError = writable('');

const run = createRunner(accountsBusy, accountsError);

export async function loadAccounts(): Promise<void> {
  const data = await accountsApi.fetchAccounts();
  accounts.set(data.accounts);
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
