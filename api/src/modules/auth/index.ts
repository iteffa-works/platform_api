import type { Plugin } from '../../core/plugins/index.js';
import { authRoutes } from './routes.js';

/** Плагін platform-auth */
export const plugin: Plugin = {
  name: 'auth',
  contour: 'platform',
  routes: authRoutes,
};

export { login, me, register } from './service.js';
export { authRoutes };
