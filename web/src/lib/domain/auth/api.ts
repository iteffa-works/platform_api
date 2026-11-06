import { api } from '$lib/core/api';
import type { User } from '$lib/shared/types';

export function fetchMe() {
  return api<{ user: User }>('/auth/me');
}

export function postAuth(endpoint: string, email: string, password: string) {
  return api<{ token: string; user: User }>(endpoint, {
    method: 'POST',
    body: { email, password },
  });
}
