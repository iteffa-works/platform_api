/** Клієнтські прапорці auth-розширень (дзеркало api/auth/config) */
export const authConfig = {
  captcha: true,
  form: true,
  forgotEmail: true,
  forgotPassword: true,
  passwordless: true,
  registerLink: true,
  accountType: true,
  verification: true,
  contacts: true,
  terms: true,
  twoFactor: false,
} as const;

export type AuthMode = 'login' | 'register';
