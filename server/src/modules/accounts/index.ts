import type { Plugin } from '../../plugins/types.js';
import { accountRoutes } from './accounts.routes.js';

export const plugin: Plugin = {
  name: 'accounts',
  routes: accountRoutes,
};

export { createAccount, deleteAccount, listAccounts, updateAccount } from './accounts.service.js';
export { accountRoutes };
