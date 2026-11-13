/** Клієнтські прапорці auth-розширень (стан капчі уточнює GET /auth/captcha) */
export const authConfig = {
  captcha: true,
} as const;

export type AuthMode = 'login' | 'register';
