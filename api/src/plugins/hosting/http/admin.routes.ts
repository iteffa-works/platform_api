/** Адмінка: сервери, тарифи, акаунти, огляд */
import type { Router } from 'express';
import { asyncRoute } from '../../../shared/http/index.js';
import { userIdOf } from '../../../shared/middleware/index.js';
import type { HostingModule } from '../module.js';
import { actor, body, guard, params } from './guards.js';

export function adminRoutes(router: Router, hosting: HostingModule): void {
  const A = '/admin/hosting';
  const { servers, plans, accounts } = hosting;

  router.get(`${A}/stats`, ...guard.view, asyncRoute(async (_req, res) => res.json(await accounts.stats())));

  /* Сервери */
  router.get(`${A}/servers`, ...guard.view, asyncRoute(async (_req, res) => res.json(await servers.list())));
  router.post(`${A}/servers`, ...guard.manage, asyncRoute(async (req, res) => res.status(201).json(await servers.create(body(req)))));
  router.patch(`${A}/servers/:id`, ...guard.manage, asyncRoute(async (req, res) => res.json(await servers.update(params.server(req), body(req)))));
  router.delete(`${A}/servers/:id`, ...guard.manage, asyncRoute(async (req, res) => {
    await servers.remove(params.server(req));
    res.status(204).end();
  }));
  router.post(`${A}/servers/:id/check`, ...guard.manage, asyncRoute(async (req, res) => res.json(await servers.check(params.server(req)))));
  router.get(`${A}/servers/:id/packages`, ...guard.view, asyncRoute(async (req, res) => res.json(await servers.packages(params.server(req)))));
  router.get(`${A}/servers/:id/accounts`, ...guard.view, asyncRoute(async (req, res) => res.json(await servers.panelAccounts(params.server(req)))));
  router.get(`${A}/servers/:id/diagnostics`, ...guard.manage, asyncRoute(async (req, res) => {
    res.json(await servers.diagnostics(params.server(req), String(req.query.login ?? '')));
  }));

  /* Тарифи */
  router.get(`${A}/plans`, ...guard.view, asyncRoute(async (_req, res) => res.json({ plans: await plans.list() })));
  router.post(`${A}/plans`, ...guard.manage, asyncRoute(async (req, res) => res.status(201).json(await plans.create(body(req)))));
  router.patch(`${A}/plans/:id`, ...guard.manage, asyncRoute(async (req, res) => res.json(await plans.update(params.plan(req), body(req)))));
  router.delete(`${A}/plans/:id`, ...guard.manage, asyncRoute(async (req, res) => {
    await plans.remove(params.plan(req));
    res.status(204).end();
  }));

  /* Акаунти */
  router.get(`${A}/accounts`, ...guard.view, asyncRoute(async (req, res) => res.json(await accounts.list({ status: req.query.status }))));
  router.post(`${A}/accounts`, ...guard.manage, asyncRoute(async (req, res) => {
    res.status(201).json(await accounts.adminCreate(req, userIdOf(req), body(req)));
  }));
  router.patch(`${A}/accounts/:id`, ...guard.manage, asyncRoute(async (req, res) => {
    res.json(await accounts.adminUpdate(req, userIdOf(req), params.account(req), body(req)));
  }));
  router.post(`${A}/accounts/:id/suspend`, ...guard.manage, asyncRoute(async (req, res) => {
    res.json(await accounts.setStatus(params.account(req), 'suspend', actor(req)));
  }));
  router.post(`${A}/accounts/:id/resume`, ...guard.manage, asyncRoute(async (req, res) => {
    res.json(await accounts.setStatus(params.account(req), 'resume', actor(req)));
  }));
  router.post(`${A}/accounts/:id/usage`, ...guard.view, asyncRoute(async (req, res) => res.json(await accounts.adminRefreshUsage(params.account(req)))));
  router.post(`${A}/accounts/:id/login`, ...guard.manage, asyncRoute(async (req, res) => {
    res.json(await accounts.adminLoginUrl(req, userIdOf(req), params.account(req)));
  }));
  router.delete(`${A}/accounts/:id`, ...guard.manage, asyncRoute(async (req, res) => {
    await accounts.remove(params.account(req), body(req).removeFromPanel === true, actor(req));
    res.status(204).end();
  }));
}
