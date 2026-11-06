import type { Router } from 'express';
import { asyncRoute, HttpError } from '../../../../shared/http/index.js';
import { authConfig } from '../../config.js';
import type { AuthExtension } from '../types.js';

/** Stub: вхід без пароля (magic link) */
function routes(router: Router): void {
  router.post('/auth/passwordless', asyncRoute(async () => {
    throw new HttpError(501, 'Вхід без пароля ще не реалізовано');
  }));
}

export const extension: AuthExtension = {
  name: 'passwordless',
  enabled: authConfig.passwordless,
  routes,
};
