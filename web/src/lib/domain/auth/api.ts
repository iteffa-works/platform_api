import { api } from '$lib/core/api';
import type { User } from '$lib/shared/types';

export function fetchMe() {
  return api<{ user: User }>('/auth/me');
}

/** Login/register з додатковими полями від extensions */
export function postAuth(
  endpoint: string,
  email: string,
  password: string,
  extra: Record<string, unknown> = {},
) {
  return api<{ token: string; user: User }>(endpoint, {
    method: 'POST',
    body: { email, password, ...extra },
  });
}
