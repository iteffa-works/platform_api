/** Стан image-captcha для форми auth */
let enabled = true;
let captchaToken = '';
let captchaAnswer = '';

const refreshListeners = new Set<() => void>();

/** Сервер повідомив, чи капча увімкнена (AUTH_CAPTCHA) */
export function setCaptchaEnabled(value: boolean): void {
  enabled = value;
}

export function isCaptchaEnabled(): boolean {
  return enabled;
}

export function setCaptchaToken(value: string): void {
  captchaToken = value;
}

export function setCaptchaAnswer(value: string): void {
  captchaAnswer = value;
}

export function getCaptchaToken(): string {
  return captchaToken;
}

export function getCaptchaAnswer(): string {
  return captchaAnswer;
}

export function onCaptchaRefreshRequest(listener: () => void): () => void {
  refreshListeners.add(listener);
  return () => {
    refreshListeners.delete(listener);
  };
}

export function requestCaptchaRefresh(): void {
  for (const listener of refreshListeners) listener();
}
