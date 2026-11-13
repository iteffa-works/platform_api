import type { Permissions } from '../core/access/index.js';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      /** Права з ролі; заповнює requirePermission */
      permissions?: Permissions;
    }
  }
}
