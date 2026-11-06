import type { Plugin } from '../../plugins/types.js';
import { checkRoutes } from './checks.routes.js';

export const plugin: Plugin = {
  name: 'checks',
  routes: checkRoutes,
};

export { cancelCheck, createCheck, getCheck, listChecks } from './checks.service.js';
export { checkRoutes };
