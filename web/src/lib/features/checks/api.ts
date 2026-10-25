import { api } from '$lib/core/api';
import type { CheckDetail, CheckItem } from '$lib/shared/types';

export function fetchChecks() {
  return api<{ checks: CheckItem[] }>('/checks');
}

export function createCheck(accountId: string, queries: string) {
  return api<{ check: CheckDetail }>('/checks', {
    method: 'POST',
    body: { accountId, queries },
  });
}

export function fetchCheck(id: string) {
  return api<{ check: CheckDetail }>(`/checks/${id}`);
}

export function cancelCheck(id: string) {
  return api<{ check: CheckDetail }>(`/checks/${id}/cancel`, { method: 'POST' });
}
