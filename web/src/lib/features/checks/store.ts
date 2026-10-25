import { get, writable } from 'svelte/store';
import { loadAccounts } from '$lib/features/accounts/store';
import type { CheckDetail, CheckItem } from '$lib/shared/types';
import * as checksApi from './api';

export const checks = writable<CheckItem[]>([]);
export const activeCheck = writable<CheckDetail | null>(null);
export const checksBusy = writable(false);
export const checksError = writable('');

export async function loadChecks(): Promise<void> {
  const data = await checksApi.fetchChecks();
  checks.set(data.checks);
}

export async function loadCabinet(): Promise<void> {
  await Promise.all([loadAccounts(), loadChecks()]);
}

async function run(action: () => Promise<void>): Promise<void> {
  checksError.set('');
  checksBusy.set(true);
  try {
    await action();
  } catch (err) {
    checksError.set(err instanceof Error ? err.message : 'Помилка');
  } finally {
    checksBusy.set(false);
  }
}

export function startCheck(accountId: string, queries: string) {
  return run(async () => {
    const data = await checksApi.createCheck(accountId, queries);
    activeCheck.set(data.check);
    await loadChecks();
  });
}

export function openCheck(id: string) {
  return run(async () => {
    const data = await checksApi.fetchCheck(id);
    activeCheck.set(data.check);
  });
}

export function cancelActiveCheck() {
  const active = get(activeCheck);
  if (!active) return Promise.resolve();
  return run(async () => {
    const data = await checksApi.cancelCheck(active.id);
    activeCheck.set(data.check);
    await loadChecks();
  });
}
