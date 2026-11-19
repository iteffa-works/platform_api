import type { Router } from 'express';
import type { ActivityEvent } from '../../flowaxy/activity/index.js';
import type { Plugin } from '../../flowaxy/plugins/index.js';
import { asyncRoute, parseId } from '../../shared/http/index.js';
import { userIdOf } from '../../shared/middleware/index.js';
import { guards } from '../../flowaxy/services/index.js';
import { ActivityLog } from './model.js';
import { listActivity } from './service.js';
import { registerActivityDashboard } from './ui/dashboard.js';
import { activityUi } from './ui/index.js';

/** Запис події `activity` у журнал */
async function record(payload?: unknown): Promise<void> {
  const event = payload as ActivityEvent;
  await ActivityLog.create({
    userId: event.userId,
    action: event.action.slice(0, 48),
    ip: event.ip,
    userAgent: event.userAgent,
    meta: event.meta ? JSON.stringify(event.meta) : null,
  });
}

function routes(router: Router): void {
  /** Власний журнал у кабінеті */
  router.get('/cabinet/activity', guards.user, asyncRoute(async (req, res) => {
    res.json(await listActivity({ userId: userIdOf(req), limit: 100 }));
  }));

  /** Журнал усіх користувачів (адмінка), `?userId=` — фільтр */
  router.get(
    '/admin/activity',
    guards.user,
    guards.permission('admin.panel', 'view'),
    guards.permission('logs', 'view'),
    asyncRoute(async (req, res) => {
      res.json(await listActivity({ userId: parseId(req.query.userId) ?? undefined, limit: 200, withUser: true }));
    }),
  );
}

/** Плагін журналу дій: слухає подію `activity` від інших плагінів; сторінка й віджет адмінки */
export const plugin: Plugin = {
  name: 'activity',
  title: 'Журнал дій',
  description: 'Події користувачів і адміністраторів',
  defaultEnabled: true,
  contour: 'platform',
  permissions: {
    logs: { label: 'Журнал дій', levels: ['view'] },
  },
  events: { activity: record },
  ui: activityUi,
  routes,
  init: registerActivityDashboard,
};
