import type { Router } from 'express';
import { track } from '../../core/activity/index.js';
import { enabledAddons, listPlugins, setEnabled, type Plugin } from '../../core/plugins/index.js';
import { asyncRoute, HttpError } from '../../shared/http/index.js';
import { userIdOf } from '../../shared/middleware/index.js';
import { requirePermission, requireUser } from '../auth/access.js';

function routes(router: Router): void {
  // Публічно: web ховає сторінки й меню вимкнених addon (лише імена)
  router.get('/plugins', (_req, res) => {
    res.json({ enabled: enabledAddons() });
  });

  const admin = [requireUser, requirePermission('admin.panel', 'view')];

  router.get('/admin/plugins', ...admin, requirePermission('plugins', 'view'), (_req, res) => {
    res.json({ plugins: listPlugins() });
  });

  router.patch('/admin/plugins/:name', ...admin, requirePermission('plugins', 'manage'), asyncRoute(async (req, res) => {
    const enabled = req.body?.enabled;
    if (typeof enabled !== 'boolean') throw new HttpError(400, 'Некоректний запит');
    const plugin = await setEnabled(String(req.params.name), enabled);
    await track(req, userIdOf(req), 'admin.plugin_toggled', { plugin: plugin.title, state: enabled ? 'on' : 'off' });
    res.json({ plugin });
  }));
}

/** Керування плагінами: список, увімкнення / вимкнення addon з `plugins/` */
export const plugin: Plugin = {
  name: 'plugins',
  title: 'Плагіни',
  contour: 'platform',
  permissions: {
    plugins: { label: 'Плагіни', levels: ['view', 'manage'] },
  },
  routes,
};
