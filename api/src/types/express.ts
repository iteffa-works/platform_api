import type { Permissions } from '../flowaxy/access/index.js';

declare global {
  namespace Express {
    interface Request {
      userId?: number;
      sessionId?: number;
      /** Права з ролі; заповнює requirePermission */
      permissions?: Permissions;
    }
  }
}
