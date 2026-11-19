import type { Router } from 'express';
import type { Plugin } from '../../flowaxy/plugins/index.js';
import { asyncRoute, readIdParam } from '../../shared/http/index.js';
import { userIdOf } from '../../shared/middleware/index.js';
import { guards, provide } from '../../flowaxy/services/index.js';
import { loyalty } from './loyalty.js';
import * as billing from './service.js';
import { registerBillingDashboard } from './ui/dashboard.js';
import { billingUi } from './ui/index.js';

// Порт гаманця для плагінів (хостинг, …): оплата послуг з балансу
provide('wallet', { balance: billing.balanceCents, charge: billing.chargeService, refund: billing.refundService }, 'billing');

function routes(router: Router): void {
  const id = (value: unknown) => readIdParam(value, 'Заявку не знайдено');

  // Кабінет: баланс, поповнення заявками
  router.get('/cabinet/billing', guards.user, asyncRoute(async (req, res) => {
    res.json(await billing.details(userIdOf(req)));
  }));
  router.get('/cabinet/billing/summary', guards.user, asyncRoute(async (req, res) => {
    res.json(await billing.summary(userIdOf(req)));
  }));
  router.get('/cabinet/billing/loyalty', guards.user, asyncRoute(async (req, res) => {
    res.json(await loyalty(userIdOf(req)));
  }));
  router.post('/cabinet/billing/topups', guards.user, asyncRoute(async (req, res) => {
    res.status(201).json(await billing.createTopup(req, userIdOf(req), req.body ?? {}));
  }));
  router.delete('/cabinet/billing/topups/:id', guards.user, asyncRoute(async (req, res) => {
    await billing.cancelTopup(userIdOf(req), id(req.params.id));
    res.status(204).end();
  }));

  // Адмінка (доступ — явно: порядок завантаження плагінів не гарантує спільний middleware)
  const admin = [guards.user, guards.permission('admin.panel', 'view')];
  const view = [...admin, guards.permission('billing', 'view')];
  const manage = [...admin, guards.permission('billing', 'manage')];

  router.get('/admin/billing', ...view, asyncRoute(async (_req, res) => {
    res.json(await billing.adminOverview());
  }));
  router.post('/admin/billing/adjust', ...manage, asyncRoute(async (req, res) => {
    res.json(await billing.adjustBalance(req, userIdOf(req), req.body ?? {}));
  }));
  router.get('/admin/billing/topups', ...view, asyncRoute(async (req, res) => {
    res.json(await billing.adminTopups(String(req.query.status ?? '')));
  }));
  router.post('/admin/billing/topups/:id/confirm', ...manage, asyncRoute(async (req, res) => {
    res.json(await billing.confirmTopup(req, userIdOf(req), id(req.params.id)));
  }));
  router.post('/admin/billing/topups/:id/reject', ...manage, asyncRoute(async (req, res) => {
    await billing.rejectTopup(req, userIdOf(req), id(req.params.id), req.body?.reason);
    res.status(204).end();
  }));
  router.get('/admin/billing/settings', ...manage, asyncRoute(async (_req, res) => {
    res.json(await billing.adminSettings());
  }));
  router.patch('/admin/billing/settings', ...manage, asyncRoute(async (req, res) => {
    res.json(await billing.updateSettings(req, userIdOf(req), req.body ?? {}));
  }));
}

/** Плагін білінгу: баланс для оплати послуг, поповнення заявками (картка / банківський переказ), журнал операцій */
export const plugin: Plugin = {
  name: 'billing',
  title: 'Білінг',
  description: 'Баланс для оплати послуг, поповнення на картку або банківським переказом (порт wallet)',
  defaultEnabled: true,
  contour: 'platform',
  permissions: {
    billing: { label: 'Білінг', levels: ['view', 'manage'] },
  },
  ui: billingUi,
  routes,
  init: registerBillingDashboard,
};
