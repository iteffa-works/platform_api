import type { Router } from 'express';
import { asyncRoute, HttpError } from '../../../../shared/http/index.js';
import { authConfig } from '../../config.js';
import type { AuthExtension } from '../types.js';

/** Stub: відновлення email (UI-лінк + майбутній API) */
function routes(router: Router): void {
  router.post('/auth/forgot-email', asyncRoute(async () => {
    throw new HttpError(501, 'Відновлення email ще не реалізовано');
  }));
}

export const extension: AuthExtension = {
  name: 'forgot-email',
  enabled: authConfig.forgotEmail,
  routes,
};
