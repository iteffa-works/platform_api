import { goto } from '$app/navigation';
import { derived, get, writable } from 'svelte/store';
import { clearToken, getToken, setToken } from '$lib/core/session';
import type { User } from '$lib/shared/types';
import { fetchMe } from './api.js';

export const token = writable(getToken());
export const user = writable<User | null>(null);
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

/** Вихід з переходом на сторінку входу */
export function signOut(): Promise<void> {
  logout();
  return goto('/login');
}

export async function loadMe(): Promise<User> {
  const data = await fetchMe();
  user.set(data.user);
  return data.user;
}

export async function ensureAuth(): Promise<boolean> {
  if (!get(token)) return false;
  try {
    await loadMe();
    return true;
  } catch {
    logout();
    return false;
  }
}
