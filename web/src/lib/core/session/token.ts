const KEY = 'platform_token';

export function getToken(): string {
  if (typeof localStorage === 'undefined') return '';
  return localStorage.getItem(KEY) || '';
}

export function setToken(token: string): void {
  localStorage.setItem(KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(KEY);
}
