import type { Router } from 'express';
import { accountRoutes } from './accounts/index.js';
import { authRoutes } from './auth/index.js';
import { checkRoutes } from './checks/index.js';
import { healthRoutes } from './health/index.js';

export function registerModules(router: Router): void {
  healthRoutes(router);
  authRoutes(router);
  accountRoutes(router);
  checkRoutes(router);
}
