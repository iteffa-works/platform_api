import type { NextFunction, Request, Response } from 'express';
import { readToken } from '../crypto/index.js';
import { HttpError } from '../errors/http-error.js';
import { readBearer } from '../http/bearer.js';

/** JWT користувача для platform API */
export function requireUser(req: Request, _res: Response, next: NextFunction): void {
  const token = readBearer(req);
  if (!token) {
    next(new HttpError(401, 'Потрібен вхід'));
    return;
  }
  try {
    req.userId = readToken(token).sub;
    next();
  } catch {
    next(new HttpError(401, 'Сесія недійсна'));
  }
}

/** id користувача після requireUser */
export function userIdOf(req: Request): string {
  if (!req.userId) throw new HttpError(401, 'Сесія недійсна');
  return req.userId;
}
