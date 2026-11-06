import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import { config } from '../../../../config/index.js';
import { HttpError } from '../../../../shared/http/index.js';
import { authConfig } from '../../config.js';
import { renderCaptchaSvg } from './svg.js';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const TTL_MS = 5 * 60_000;

type CaptchaPayload = {
  ans: string;
  exp: number;
};

function sign(payload: CaptchaPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = createHmac('sha256', config.secret).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function unsign(token: string): CaptchaPayload | null {
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;

  const expected = createHmac('sha256', config.secret).update(body).digest('base64url');
  const left = Buffer.from(sig);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as CaptchaPayload;
    if (!payload?.ans || typeof payload.exp !== 'number') return null;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

function randomCode(length = 5): string {
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += ALPHABET[randomInt(0, ALPHABET.length)];
  }
  return out;
}

/** Новий challenge для клієнта */
export function createCaptchaChallenge() {
  const answer = randomCode(5);
  const captchaToken = sign({
    ans: answer.toLowerCase(),
    exp: Date.now() + TTL_MS,
  });
  const svg = renderCaptchaSvg(answer);
  const image = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  return { captchaToken, image };
}

/** Перевірка відповіді користувача */
export function verifyCaptchaAnswer(captchaToken: string, captchaAnswer: string): void {
  if (!authConfig.captcha) return;

  const token = String(captchaToken || '').trim();
  const answer = String(captchaAnswer || '').trim().toLowerCase();
  if (!token || !answer) {
    throw new HttpError(400, 'Введіть код з зображення');
  }

  const payload = unsign(token);
  if (!payload) {
    throw new HttpError(400, 'Капча застаріла, оновіть код');
  }
  if (payload.ans !== answer) {
    throw new HttpError(400, 'Невірний код капчі');
  }
}
