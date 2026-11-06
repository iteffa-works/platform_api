import type { Router } from 'express';
import { asyncRoute, HttpError } from '../../../../shared/http/index.js';
import { authConfig } from '../../config.js';
import type { AuthExtension } from '../types.js';

/** Stub: відновлення пароля */
function routes(router: Router): void {
  router.post('/auth/forgot-password', asyncRoute(async () => {
    throw new HttpError(501, 'Відновлення пароля ще не реалізовано');
  }));
}

export const extension: AuthExtension = {
  name: 'forgot-password',
  enabled: authConfig.forgotPassword,
  routes,
};
