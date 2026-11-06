import type { Plugin } from '../../core/plugins/index.js';
import { adminRoutes } from './routes.js';

/** Плагін адмінки платформи */
export const plugin: Plugin = {
  name: 'admin',
  contour: 'platform',
  routes: adminRoutes,
};

export { listUsers, setUserRole } from './service.js';
export { adminRoutes };
