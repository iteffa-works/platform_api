import type { NextFunction, Request, Response } from 'express';
import { config } from '../../config/index.js';
import { HttpError } from '../errors/http-error.js';
import { readBearer } from '../http/bearer.js';
import { createRateLimiter } from '../http/rate-limit.js';

const limiter = createRateLimiter({ windowMs: 60_000, max: config.clientRateLimitPerMinute });

function readClientKey(req: Request): string {
  const bearer = readBearer(req);
  if (bearer) return bearer;
  const raw = req.headers['x-client-key'];
  return String(Array.isArray(raw) ? raw[0] : raw || '').trim();
}

/** Client contour: API key + rate limit */
export function requireClient(req: Request, _res: Response, next: NextFunction): void {
  try {
    const key = readClientKey(req);
    if (!key || key !== config.clientApiKey) throw new HttpError(401, 'Невірний клієнтський ключ');
    limiter.hit(key);
    next();
  } catch (error) {
    next(error);
  }
}
