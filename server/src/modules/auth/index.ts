import type { Plugin } from '../../core/plugins/index.js';
import { authRoutes } from './routes.js';

export const plugin: Plugin = {
  name: 'auth',
  routes: authRoutes,
};

export { login, me, register } from './service.js';
export { authRoutes };
