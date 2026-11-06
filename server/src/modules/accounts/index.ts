import type { Plugin } from '../../core/plugins/index.js';
import { accountRoutes } from './routes.js';

export const plugin: Plugin = {
  name: 'accounts',
  routes: accountRoutes,
};

export { createAccount, deleteAccount, listAccounts, updateAccount } from './service.js';
export { accountRoutes };
