/** Стан image-captcha для форми auth */
let captchaToken = '';
let captchaAnswer = '';

type RefreshListener = () => void;
const refreshListeners = new Set<RefreshListener>();

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

export function resetCaptchaAnswer(): void {
  captchaAnswer = '';
}

export function onCaptchaRefreshRequest(listener: RefreshListener): () => void {
  refreshListeners.add(listener);
  return () => {
    refreshListeners.delete(listener);
  };
}

export function requestCaptchaRefresh(): void {
  for (const listener of refreshListeners) listener();
}
