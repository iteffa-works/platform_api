import type { Router } from 'express';
import { track } from '../../flowaxy/activity/index.js';
import { enabledPlugins, listPlugins, setEnabled, type Plugin } from '../../flowaxy/plugins/index.js';
import { asyncRoute, HttpError } from '../../shared/http/index.js';
import { userIdOf } from '../../shared/middleware/index.js';
import { guards } from '../../flowaxy/services/index.js';

function routes(router: Router): void {
  // Публічно: web ховає сторінки й меню вимкнених плагінів (лише імена)
  router.get('/plugins', (_req, res) => {
    res.json({ enabled: enabledPlugins() });
  });

  const admin = [guards.user, guards.permission('admin.panel', 'view')];

  router.get('/admin/plugins', ...admin, guards.permission('plugins', 'view'), (_req, res) => {
    res.json({ plugins: listPlugins() });
  });

  router.patch('/admin/plugins/:name', ...admin, guards.permission('plugins', 'manage'), asyncRoute(async (req, res) => {
    const enabled = req.body?.enabled;
    if (typeof enabled !== 'boolean') throw new HttpError(400, 'Некоректний запит');
    const plugin = await setEnabled(String(req.params.name), enabled);
    await track(req, userIdOf(req), 'admin.plugin_toggled', { plugin: plugin.title, state: enabled ? 'on' : 'off' });
    res.json({ plugin });
  }));
}

/** Керування плагінами: список, увімкнення / вимкнення плагінів з `plugins/` */
export const plugin: Plugin = {
  name: 'plugins',
  title: 'Плагіни',
  contour: 'platform',
  permissions: {
    plugins: { label: 'Плагіни', levels: ['view', 'manage'] },
  },
  routes,
};
