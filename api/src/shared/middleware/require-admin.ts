import type { NextFunction, Request, Response } from 'express';
import { User } from '../../modules/auth/models/user.js';
import { HttpError } from '../errors/http-error.js';
import { userIdOf } from './require-user.js';

/** Доступ лише для ролі admin */
export async function requireAdmin(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await User.findByPk(userIdOf(req));
    if (!user) throw new HttpError(401, 'Сесія недійсна');
    if (user.role !== 'admin') throw new HttpError(403, 'Потрібні права адміністратора');
    next();
  } catch (error) {
    next(error);
  }
}
