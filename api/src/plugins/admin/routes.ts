/** Адмінка: спільний шлюз `/admin/*` — потрібен вхід і доступ до адмінки (розділи плагінів додають свої права) */
import type { Router } from 'express';
import { guards } from '../../flowaxy/services/index.js';

export function adminRoutes(router: Router): void {
  router.use('/admin', guards.user, guards.permission('admin.panel', 'view'));
}
