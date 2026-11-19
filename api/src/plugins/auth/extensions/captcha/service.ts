import { randomInt } from 'node:crypto';
import { readPayload, signPayload } from '../../../../shared/crypto/index.js';
import { HttpError } from '../../../../shared/http/index.js';
import { authConfig } from '../../config.js';
import { renderCaptchaSvg } from './svg.js';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const TTL_MS = 5 * 60_000;

function randomCode(length = 5): string {
  let out = '';
  for (let i = 0; i < length; i += 1) out += ALPHABET[randomInt(0, ALPHABET.length)];
  return out;
}

/** Новий challenge: відповідь лише в підписаному токені */
export function createCaptchaChallenge() {
  const answer = randomCode(5);
  const captchaToken = signPayload({ ans: answer.toLowerCase() }, TTL_MS);
  const image = `data:image/svg+xml;base64,${Buffer.from(renderCaptchaSvg(answer)).toString('base64')}`;
  return { captchaToken, image };
}

/** Перевірка відповіді користувача */
export function verifyCaptchaAnswer(captchaToken: string, captchaAnswer: string): void {
  if (!authConfig.captcha) return;

  const token = String(captchaToken || '').trim();
  const answer = String(captchaAnswer || '').trim().toLowerCase();
  if (!token || !answer) throw new HttpError(400, 'Введіть код з зображення');

  const payload = readPayload<{ ans?: unknown }>(token);
  if (!payload || typeof payload.ans !== 'string') throw new HttpError(400, 'Капча застаріла, оновіть код');
  if (payload.ans !== answer) throw new HttpError(400, 'Невірний код капчі');
}
