/** Конфігурація модуля auth: увімкнення / вимкнення розширень */
function flag(name: string, fallback = true): boolean {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  return !['0', 'false', 'off', 'no'].includes(raw.toLowerCase());
}

export const authConfig = {
  /** Image-captcha */
  captcha: flag('AUTH_CAPTCHA', true),
  /** Форма email+пароль (login/register endpoints) */
  form: flag('AUTH_FORM', true),
} as const;

export type AuthConfig = typeof authConfig;
export type AuthExtensionName = keyof AuthConfig;
