import type { Plugin } from '../../plugins/types.js';
import { authRoutes } from './auth.routes.js';

export const plugin: Plugin = {
  name: 'auth',
  routes: authRoutes,
};

export { login, me, register } from './auth.service.js';
export { authRoutes };
