import type { NextFunction, Request, Response } from 'express';
import { readToken } from '../crypto/index.js';
import { HttpError } from '../errors/http-error.js';

export function requireUser(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
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
