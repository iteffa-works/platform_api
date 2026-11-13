import type { Plugin } from '../../core/plugins/index.js';
import { accountRoutes } from './routes.js';

/** Плагін акаунтів кабінету */
export const plugin: Plugin = {
  name: 'accounts',
  contour: 'platform',
  routes: accountRoutes,
};

export { createAccount, deleteAccount, listAccounts, updateAccount } from './service.js';
