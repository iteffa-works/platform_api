import type { NextFunction, Request, Response } from 'express';
import { can, type GrantLevel, type Permissions } from '../../flowaxy/access/index.js';
import { HttpError } from '../../shared/http/index.js';
import { userIdOf } from '../../shared/middleware/index.js';
import { findUserWithRole } from './models/user.js';
import { findSession } from './sessions.js';

/** Middleware: активна серверна сесія з cookie → req.userId, req.sessionId */
export async function requireUser(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const session = await findSession(req);
    if (!session) throw new HttpError(401, 'Потрібен вхід');
    req.userId = session.userId;
    req.sessionId = session.id;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Права поточного користувача (після requireUser).
 * Читаються з БД на кожен запит — зміна ролі діє одразу.
 */
export async function permissionsOf(req: Request): Promise<Permissions> {
  if (req.permissions) return req.permissions;
  const user = await findUserWithRole(userIdOf(req));
  if (!user?.role) throw new HttpError(401, 'Сесія недійсна');
  req.permissions = user.role.permissions;
  return req.permissions;
}

/** Middleware: потрібен рівень `level` на ресурс `resource` */
export function requirePermission(resource: string, level: GrantLevel) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!can(await permissionsOf(req), resource, level)) {
        throw new HttpError(403, 'Недостатньо прав');
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}
