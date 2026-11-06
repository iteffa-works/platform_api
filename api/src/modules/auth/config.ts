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
  /** «Забули email?» */
  forgotEmail: flag('AUTH_FORGOT_EMAIL', true),
  /** «Забули пароль?» */
  forgotPassword: flag('AUTH_FORGOT_PASSWORD', true),
  /** «Увійти без пароля» */
  passwordless: flag('AUTH_PASSWORDLESS', true),
  /** CTA реєстрації / зворотного входу */
  registerLink: flag('AUTH_REGISTER_LINK', true),
  /** Тип акаунта (користувач / компанія) */
  accountType: flag('AUTH_ACCOUNT_TYPE', true),
  /** Блок верифікації при реєстрації */
  verification: flag('AUTH_VERIFICATION', true),
  /** Контакти (телефон, месенджер) */
  contacts: flag('AUTH_CONTACTS', true),
  /** Угода / згода на обробку даних */
  terms: flag('AUTH_TERMS', true),
  /** Двофакторна авторизація */
  twoFactor: flag('AUTH_TWO_FACTOR', false),
} as const;

export type AuthConfig = typeof authConfig;
export type AuthExtensionName = keyof AuthConfig;
