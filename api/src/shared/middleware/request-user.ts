import type { Request } from 'express';
import { HttpError } from '../errors/http-error.js';

/** id користувача після requireUser (модуль auth) */
export function userIdOf(req: Request): number {
  if (!req.userId) throw new HttpError(401, 'Сесія недійсна');
  return req.userId;
}

/** id поточної сесії після requireUser */
export function sessionIdOf(req: Request): number {
  if (!req.sessionId) throw new HttpError(401, 'Сесія недійсна');
  return req.sessionId;
}
