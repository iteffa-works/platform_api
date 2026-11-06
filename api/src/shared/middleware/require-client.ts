import type { NextFunction, Request, Response } from 'express';
import { config } from '../../config/index.js';
import { HttpError } from '../errors/http-error.js';

const hits = new Map<string, { count: number; resetAt: number }>();

function readClientKey(req: Request): string {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7).trim();
  const raw = req.headers['x-client-key'];
  return String(Array.isArray(raw) ? raw[0] : raw || '').trim();
}

function enforceRateLimit(key: string): void {
  const now = Date.now();
  const windowMs = 60_000;
  const current = hits.get(key);
  if (!current || current.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  current.count += 1;
  if (current.count > config.clientRateLimitPerMinute) {
    throw new HttpError(429, 'Занадто багато запитів');
  }
}

/** Client contour: API key + rate limit */
export function requireClient(req: Request, _res: Response, next: NextFunction): void {
  try {
    const key = readClientKey(req);
    if (!key || key !== config.clientApiKey) {
      next(new HttpError(401, 'Невірний клієнтський ключ'));
      return;
    }
    enforceRateLimit(key);
    req.clientKey = key;
    next();
  } catch (error) {
    next(error);
  }
}
