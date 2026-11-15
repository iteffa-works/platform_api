/** Кабінет: лише власні акаунти (пошук за id + userId) */
import type { Router } from 'express';
import { asyncRoute } from '../../../shared/http/index.js';
import { userIdOf } from '../../../shared/middleware/index.js';
import type { HostingModule } from '../module.js';
import { body, guard, params } from './guards.js';

export function cabinetRoutes(router: Router, hosting: HostingModule): void {
  const C = '/cabinet/hosting';
  const { accounts, orders } = hosting;

  router.get(C, ...guard.user, asyncRoute(async (req, res) => res.json(await accounts.listMine(userIdOf(req)))));
  router.get(`${C}/catalog`, ...guard.user, asyncRoute(async (req, res) => res.json(await orders.catalog(userIdOf(req)))));
  router.post(`${C}/order`, ...guard.user, asyncRoute(async (req, res) => res.status(201).json(await orders.order(req, userIdOf(req), body(req)))));

  router.get(`${C}/:id`, ...guard.user, asyncRoute(async (req, res) => res.json(await accounts.viewMine(userIdOf(req), params.account(req)))));
  router.patch(`${C}/:id`, ...guard.user, asyncRoute(async (req, res) => res.json(await accounts.updateMine(userIdOf(req), params.account(req), body(req)))));
  router.post(`${C}/:id/renew`, ...guard.user, asyncRoute(async (req, res) => res.json(await orders.renew(req, userIdOf(req), params.account(req), body(req).months))));
  router.post(`${C}/:id/plan`, ...guard.user, asyncRoute(async (req, res) => res.json(await orders.changePlan(req, userIdOf(req), params.account(req), body(req).planId))));
  router.get(`${C}/:id/sites`, ...guard.user, asyncRoute(async (req, res) => res.json(await accounts.sitesMine(userIdOf(req), params.account(req)))));
  router.post(`${C}/:id/usage`, ...guard.user, asyncRoute(async (req, res) => res.json(await accounts.refreshUsageMine(userIdOf(req), params.account(req)))));
  router.post(`${C}/:id/login`, ...guard.user, asyncRoute(async (req, res) => res.json(await accounts.loginUrlMine(req, userIdOf(req), params.account(req)))));
  router.post(`${C}/:id/password`, ...guard.user, asyncRoute(async (req, res) => {
    await accounts.changePasswordMine(req, userIdOf(req), params.account(req), body(req).password);
    res.status(204).end();
  }));
  router.delete(`${C}/:id`, ...guard.user, asyncRoute(async (req, res) => {
    await accounts.deleteMine(req, userIdOf(req), params.account(req), body(req).confirm);
    res.status(204).end();
  }));
}
