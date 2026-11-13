import type { NextFunction, Request, Response } from 'express';
import { config } from '../../config/index.js';
import { HttpError } from '../errors/http-error.js';
import { readBearer } from '../http/bearer.js';

const WINDOW_MS = 60_000;
const hits = new Map<string, { count: number; resetAt: number }>();

function readClientKey(req: Request): string {
  const bearer = readBearer(req);
  if (bearer) return bearer;
  const raw = req.headers['x-client-key'];
  return String(Array.isArray(raw) ? raw[0] : raw || '').trim();
}

function enforceRateLimit(key: string): void {
  const now = Date.now();
  const current = hits.get(key);
  if (!current || current.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
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
    if (!key || key !== config.clientApiKey) throw new HttpError(401, 'Невірний клієнтський ключ');
    enforceRateLimit(key);
    next();
  } catch (error) {
    next(error);
  }
}
