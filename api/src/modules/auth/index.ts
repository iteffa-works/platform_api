import type { Router } from 'express';
import type { Plugin } from '../../core/plugins/index.js';
import { coreAuthRoutes } from './core/index.js';
import { listAuthExtensions, loadAuthExtensions } from './extensions/index.js';

await loadAuthExtensions();

function mountAuthExtensionRoutes(router: Router): void {
  for (const extension of listAuthExtensions()) {
    extension.routes?.(router);
  }
}

/** Плагін platform-auth: ядро + розширення */
export const plugin: Plugin = {
  name: 'auth',
  contour: 'platform',
  routes(router) {
    coreAuthRoutes(router);
    mountAuthExtensionRoutes(router);
  },
};

export { authConfig } from './config.js';
export { login, me, register } from './core/index.js';
export { listAuthExtensions, loadAuthExtensions, runAuthHooks } from './extensions/index.js';
