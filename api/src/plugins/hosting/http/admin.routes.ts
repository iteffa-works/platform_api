/** Адмінка — керування хостингом: сервери (стан, синхронізація, користувачі панелі), тарифи, акаунти, огляд */
import type { Router } from 'express';
import { userIdOf } from '../../../shared/middleware/index.js';
import type { HostingModule } from '../module.js';
import { actor, body, created, guard, json, params } from './guards.js';

export function adminRoutes(router: Router, hosting: HostingModule): void {
  const A = '/admin/hosting';
  const { servers, plans, accounts, sync } = hosting;

  router.get(`${A}/stats`, ...guard.view, json(() => accounts.stats()));
  // Синхронізувати всі увімкнені сервери й ліміти тарифів з шаблонів
  router.post(`${A}/sync`, ...guard.view, json(async () => {
    await sync.syncAll();
    return { updated: await plans.applyTemplates() };
  }));

  /* Сервери */
  router.get(`${A}/servers`, ...guard.view, json(() => servers.list()));
  router.post(`${A}/servers`, ...guard.manage, created((req) => servers.create(body(req))));
  router.get(`${A}/servers/:id`, ...guard.view, json((req) => servers.view(params.server(req))));
  router.patch(`${A}/servers/:id`, ...guard.manage, json((req) => servers.update(params.server(req), body(req))));
  router.delete(`${A}/servers/:id`, ...guard.manage, json(async (req) => void (await servers.remove(params.server(req)))));
  router.post(`${A}/servers/:id/check`, ...guard.manage, json((req) => servers.check(params.server(req))));
  router.post(`${A}/servers/:id/sync`, ...guard.view, json(async (req) => sync.syncServer(await servers.find(params.server(req)))));
  router.get(`${A}/servers/:id/overview`, ...guard.view, json((req) => servers.overview(params.server(req))));
  router.get(`${A}/servers/:id/packages`, ...guard.view, json((req) => servers.packages(params.server(req))));
  router.get(`${A}/servers/:id/users`, ...guard.view, json((req) => servers.panelAccounts(params.server(req))));
  router.post(`${A}/servers/:id/users/:key/login`, ...guard.manage, json((req) => servers.loginUrl(params.server(req), params.key(req))));
  router.get(`${A}/servers/:id/diagnostics`, ...guard.manage, json((req) => servers.diagnostics(params.server(req), String(req.query.login ?? ''))));

  /* Тарифи */
  router.get(`${A}/plans`, ...guard.view, json(async () => ({ plans: await plans.list() })));
  router.get(`${A}/plans/templates`, ...guard.view, json(async () => ({ templates: [...(await plans.templates()).values()] })));
  // Оновити шаблони з панелей і ліміти тарифів з них
  router.post(`${A}/plans/sync`, ...guard.view, json(async () => {
    const result = await sync.syncPackages();
    return { ...result, templates: (await plans.templates()).size, updated: await plans.applyTemplates() };
  }));
  router.post(`${A}/plans`, ...guard.manage, created((req) => plans.create(body(req))));
  router.patch(`${A}/plans/:id`, ...guard.manage, json((req) => plans.update(params.plan(req), body(req))));
  router.delete(`${A}/plans/:id`, ...guard.manage, json(async (req) => void (await plans.remove(params.plan(req)))));

  /* Акаунти */
  router.get(`${A}/accounts`, ...guard.view, json((req) => accounts.search({
    status: String(req.query.status ?? '') || undefined,
    q: String(req.query.q ?? '').trim().slice(0, 100) || undefined,
    sort: { key: 'created', dir: 'desc' },
    limit: Math.min(200, Math.max(1, Number(req.query.limit) || 50)),
    offset: Math.max(0, Number(req.query.offset) || 0),
  })));
  router.post(`${A}/accounts`, ...guard.manage, created((req) => accounts.adminCreate(req, userIdOf(req), body(req))));
  router.get(`${A}/accounts/:id`, ...guard.view, json(async (req) => ({ account: await accounts.view(params.account(req)) })));
  router.patch(`${A}/accounts/:id`, ...guard.manage, json((req) => accounts.adminUpdate(req, userIdOf(req), params.account(req), body(req))));
  router.post(`${A}/accounts/:id/suspend`, ...guard.manage, json((req) => accounts.setStatus(params.account(req), 'suspend', actor(req))));
  router.post(`${A}/accounts/:id/resume`, ...guard.manage, json((req) => accounts.setStatus(params.account(req), 'resume', actor(req))));
  router.post(`${A}/accounts/:id/sync`, ...guard.view, json((req) => accounts.adminSync(params.account(req))));
  router.post(`${A}/accounts/:id/login`, ...guard.manage, json((req) => accounts.adminLoginUrl(req, userIdOf(req), params.account(req))));
  router.delete(`${A}/accounts/:id`, ...guard.manage, json(async (req) => void (await accounts.remove(params.account(req), body(req).removeFromPanel === true, actor(req)))));
}
