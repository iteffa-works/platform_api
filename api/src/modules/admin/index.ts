import type { Plugin } from '../../core/plugins/index.js';
import { adminRoutes } from './routes.js';

/** Плагін адмінки платформи */
export const plugin: Plugin = {
  name: 'admin',
  contour: 'platform',
  permissions: {
    'admin.panel': { label: 'Адмінка', levels: ['view'] },
    users: { label: 'Користувачі', levels: ['view', 'manage'] },
    roles: { label: 'Ролі', levels: ['view', 'manage'] },
  },
  routes: adminRoutes,
};
