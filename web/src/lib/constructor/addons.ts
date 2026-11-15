/**
 * Увімкнені addon-плагіни (стан — в API, `/admin/plugins`).
 * Завантажується в браузері один раз; адмінка оновлює після перемикання.
 */
import { writable } from 'svelte/store';
import { api } from '$lib/core/api';

export const enabledAddons = writable<ReadonlySet<string>>(new Set());

let pending: Promise<ReadonlySet<string>> | null = null;

export function loadAddons(force = false): Promise<ReadonlySet<string>> {
  if (!pending || force) {
    pending = api<{ enabled: string[] }>('/plugins')
      .then(({ enabled }) => {
        const set = new Set(enabled);
        enabledAddons.set(set);
        return set;
      })
      .catch((error) => {
        pending = null;
        throw error;
      });
  }
  return pending;
}
