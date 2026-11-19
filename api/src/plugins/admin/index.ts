import type { Plugin } from '../../flowaxy/plugins/index.js';
import { adminRoutes } from './routes.js';
import { adminUi } from './ui/index.js';

/** Плагін адмінки: доступ до адмінки, панель-огляд (внески плагінів), керування плагінами */
export const plugin: Plugin = {
  name: 'admin',
  title: 'Адмінка',
  description: 'Доступ до адмінки, панель-огляд, керування плагінами',
  defaultEnabled: true,
  contour: 'platform',
  permissions: {
    'admin.panel': { label: 'Адмінка', levels: ['view'] },
  },
  routes: adminRoutes,
  ui: adminUi,
};
