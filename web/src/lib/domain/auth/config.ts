/** Клієнтські прапорці auth-розширень (дзеркало api/auth/config) */
export const authConfig = {
  captcha: true,
  form: true,
} as const;

export type AuthMode = 'login' | 'register';
