import { api } from '$lib/core/api';
import type { User } from '$lib/shared/types';

export type LoginResult = { user: User } | { twoFactor: true; ticket: string };

export function fetchMe() {
  return api<{ user: User }>('/auth/me');
}

/** Сесія без 401 для гостя */
export function fetchSession() {
  return api<{ user: User | null }>('/auth/session');
}

/** Login/register з додатковими полями від extensions; сесію ставить сервер (cookie) */
export function postAuth(endpoint: string, email: string, password: string, extra: Record<string, unknown> = {}) {
  return api<LoginResult>(endpoint, { method: 'POST', body: { email, password, ...extra } });
}

/** Другий крок входу з 2FA */
export function postTwoFactor(ticket: string, code: string) {
  return api<{ user: User }>('/auth/login/2fa', { method: 'POST', body: { ticket, code } });
}

export function postLogout() {
  return api('/auth/logout', { method: 'POST' });
}
