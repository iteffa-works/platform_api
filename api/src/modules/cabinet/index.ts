import type { Plugin } from '../../core/plugins/index.js';
import { cabinetRoutes } from './routes.js';

/** Плагін кабінету користувача (будь-який залогінений користувач) */
export const plugin: Plugin = {
  name: 'cabinet',
  contour: 'platform',
  routes: cabinetRoutes,
};
