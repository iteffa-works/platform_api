import type { Plugin } from '../../core/plugins/index.js';
import { clientApiRoutes } from './routes.js';

export const plugin: Plugin = {
  name: 'client-api',
  contour: 'client',
  routes: clientApiRoutes,
};

export { claimNext, clientStatus, enqueueDemo, submitResult } from './service.js';
export { clientApiRoutes };
