import type { Plugin } from '../../flowaxy/plugins/index.js';
import { clientApiRoutes } from './routes.js';

export const plugin: Plugin = {
  name: 'client-api',
  title: 'Client API',
  description: 'API для desktop-клієнта й скриптів за ключем',
  defaultEnabled: true,
  contour: 'client',
  routes: clientApiRoutes,
};
