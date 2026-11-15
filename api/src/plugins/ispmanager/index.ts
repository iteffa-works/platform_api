import type { Router } from 'express';
import type { Plugin } from '../../core/plugins/index.js';
import { asyncRoute, readIdParam } from '../../shared/http/index.js';
import { userIdOf } from '../../shared/middleware/index.js';
import { requirePermission, requireUser } from '../../modules/auth/access.js';
import * as isp from './service.js';

const SERVER = 'Сервер не знайдено';
const ACCOUNT = 'Хостинг-акаунт не знайдено';

function routes(router: Router): void {
  const admin = [requireUser, requirePermission('admin.panel', 'view')];
  const view = [...admin, requirePermission('ispmanager', 'view')];
  const manage = [...admin, requirePermission('ispmanager', 'manage')];

  /* Сервери */
  router.get('/admin/ispmanager/servers', ...view, asyncRoute(async (_req, res) => {
    res.json(await isp.listServers());
  }));

  router.post('/admin/ispmanager/servers', ...manage, asyncRoute(async (req, res) => {
    res.status(201).json(await isp.createServer(req.body ?? {}));
  }));

  router.patch('/admin/ispmanager/servers/:id', ...manage, asyncRoute(async (req, res) => {
    res.json(await isp.updateServer(readIdParam(req.params.id, SERVER), req.body ?? {}));
  }));

  router.delete('/admin/ispmanager/servers/:id', ...manage, asyncRoute(async (req, res) => {
    await isp.deleteServer(readIdParam(req.params.id, SERVER));
    res.status(204).end();
  }));

  router.post('/admin/ispmanager/servers/:id/check', ...manage, asyncRoute(async (req, res) => {
    res.json(await isp.checkServer(readIdParam(req.params.id, SERVER)));
  }));

  router.get('/admin/ispmanager/servers/:id/presets', ...view, asyncRoute(async (req, res) => {
    res.json(await isp.serverPresets(readIdParam(req.params.id, SERVER)));
  }));

  router.get('/admin/ispmanager/servers/:id/users', ...view, asyncRoute(async (req, res) => {
    res.json(await isp.serverUsers(readIdParam(req.params.id, SERVER)));
  }));

  /* Акаунти */
  router.get('/admin/ispmanager/accounts', ...view, asyncRoute(async (_req, res) => {
    res.json(await isp.listAccounts());
  }));

  router.post('/admin/ispmanager/accounts', ...manage, asyncRoute(async (req, res) => {
    res.status(201).json(await isp.createAccount(req, userIdOf(req), req.body ?? {}));
  }));

  router.post('/admin/ispmanager/accounts/:id/suspend', ...manage, asyncRoute(async (req, res) => {
    res.json(await isp.setAccountStatus(req, userIdOf(req), readIdParam(req.params.id, ACCOUNT), 'suspended'));
  }));

  router.post('/admin/ispmanager/accounts/:id/resume', ...manage, asyncRoute(async (req, res) => {
    res.json(await isp.setAccountStatus(req, userIdOf(req), readIdParam(req.params.id, ACCOUNT), 'active'));
  }));

  router.delete('/admin/ispmanager/accounts/:id', ...manage, asyncRoute(async (req, res) => {
    await isp.deleteAccount(req, userIdOf(req), readIdParam(req.params.id, ACCOUNT), req.body?.removeFromPanel === true);
    res.status(204).end();
  }));

  /* Кабінет */
  router.get('/cabinet/hosting', requireUser, asyncRoute(async (req, res) => {
    res.json(await isp.myAccounts(userIdOf(req)));
  }));

  router.get('/cabinet/hosting/:id/sites', requireUser, asyncRoute(async (req, res) => {
    res.json(await isp.mySites(userIdOf(req), readIdParam(req.params.id, ACCOUNT)));
  }));

  router.post('/cabinet/hosting/:id/login', requireUser, asyncRoute(async (req, res) => {
    res.json(await isp.panelLogin(req, userIdOf(req), readIdParam(req.params.id, ACCOUNT)));
  }));

  router.post('/cabinet/hosting/:id/password', requireUser, asyncRoute(async (req, res) => {
    await isp.changePassword(req, userIdOf(req), readIdParam(req.params.id, ACCOUNT), req.body?.password);
    res.status(204).end();
  }));
}

/** ISPmanager 6 Host: сервери, хостинг-акаунти, вхід у панель з кабінету */
export const plugin: Plugin = {
  name: 'ispmanager',
  title: 'ISPmanager 6 Host',
  description: 'Віртуальний хостинг на панелях ISPmanager 6: сервери, акаунти користувачів, вхід у панель з кабінету',
  version: '0.1.0',
  contour: 'platform',
  permissions: {
    ispmanager: { label: 'Хостинг (ISPmanager)', levels: ['view', 'manage'] },
  },
  routes,
};
