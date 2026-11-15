import type { Router } from 'express';
import type { Plugin } from '../../core/plugins/index.js';
import { asyncRoute, readIdParam } from '../../shared/http/index.js';
import { userIdOf } from '../../shared/middleware/index.js';
import { requirePermission, requireUser } from '../auth/access.js';
import * as billing from './service.js';

function routes(router: Router): void {
  // Кабінет
  router.get('/cabinet/billing', requireUser, asyncRoute(async (req, res) => {
    res.json(await billing.details(userIdOf(req)));
  }));

  router.get('/cabinet/billing/summary', requireUser, asyncRoute(async (req, res) => {
    res.json(await billing.summary(userIdOf(req)));
  }));

  router.post('/cabinet/billing/plan', requireUser, asyncRoute(async (req, res) => {
    res.json(await billing.changePlan(req, userIdOf(req), req.body?.planId));
  }));

  // Адмінка (доступ — явно: порядок завантаження плагінів не гарантує спільний middleware)
  const admin = [requireUser, requirePermission('admin.panel', 'view')];
  const view = [...admin, requirePermission('billing', 'view')];
  const manage = [...admin, requirePermission('billing', 'manage')];

  router.get('/admin/billing', ...view, asyncRoute(async (_req, res) => {
    res.json(await billing.adminOverview());
  }));

  router.post('/admin/billing/adjust', ...manage, asyncRoute(async (req, res) => {
    res.json(await billing.adjustBalance(req, userIdOf(req), req.body ?? {}));
  }));

  router.post('/admin/billing/plans', ...manage, asyncRoute(async (req, res) => {
    res.status(201).json(await billing.createPlan(req.body ?? {}));
  }));

  router.patch('/admin/billing/plans/:id', ...manage, asyncRoute(async (req, res) => {
    res.json(await billing.updatePlan(readIdParam(req.params.id, 'Тариф не знайдено'), req.body ?? {}));
  }));

  router.delete('/admin/billing/plans/:id', ...manage, asyncRoute(async (req, res) => {
    await billing.deletePlan(readIdParam(req.params.id, 'Тариф не знайдено'));
    res.status(204).end();
  }));
}

/** Плагін білінгу: тарифи, баланс, журнал операцій */
export const plugin: Plugin = {
  name: 'billing',
  contour: 'platform',
  permissions: {
    billing: { label: 'Білінг', levels: ['view', 'manage'] },
  },
  routes,
};
