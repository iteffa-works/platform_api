import { derived, get, writable } from 'svelte/store';
import { clearToken, getToken, setToken } from '$lib/core/session';
import type { User } from '$lib/shared/types';
import { fetchMe } from './api.js';

export const token = writable(getToken());
export const user = writable<User | null>(null);
export const authReady = writable(false);
export const isAuthenticated = derived(token, ($token) => Boolean($token));

export function loginWithToken(value: string): void {
  setToken(value);
  token.set(value);
}

export function logout(): void {
  clearToken();
  token.set('');
  user.set(null);
}

export async function loadMe(): Promise<User> {
  const data = await fetchMe();
  user.set(data.user);
  authReady.set(true);
  return data.user;
}

export async function ensureAuth(): Promise<boolean> {
  if (!get(token)) {
    authReady.set(true);
    return false;
  }
  try {
    await loadMe();
    return true;
  } catch {
    logout();
    authReady.set(true);
    return false;
  }
}
