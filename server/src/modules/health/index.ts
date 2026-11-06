import type { Plugin } from '../../plugins/types.js';
import { healthRoutes } from './health.routes.js';

export const plugin: Plugin = {
  name: 'health',
  routes: healthRoutes,
};

export { healthRoutes };
