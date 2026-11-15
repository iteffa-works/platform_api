import type { Router } from 'express';
import { Op } from 'sequelize';
import type { ActivityEvent } from '../../core/activity/index.js';
import type { Plugin } from '../../core/plugins/index.js';
import { asyncRoute, parseId } from '../../shared/http/index.js';
import { userIdOf } from '../../shared/middleware/index.js';
import { requireUser } from '../auth/access.js';
import { Notification } from './model.js';

/**
 * Які дії стають сповіщеннями. Ключ — `action` події, значення — параметри з `meta`.
 * Текст сповіщення web бере з перекладів `notification.<action>`.
 */
const NOTIFY: Record<string, string[]> = {
  'auth.registered': [],
  'password.changed': ['revokedSessions'],
  '2fa.enabled': [],
  '2fa.disabled': [],
  'auth.2fa_failed': [],
  'role.changed': ['role'],
  'referral.joined': [],
  'balance.changed': ['amount', 'currency'],
  'plan.changed': ['plan'],
};

async function notify(payload?: unknown): Promise<void> {
  const event = payload as ActivityEvent;
  const keys = NOTIFY[event.action];
  if (!keys) return;
  const params = Object.fromEntries(keys.filter((key) => event.meta?.[key] !== undefined).map((key) => [key, event.meta![key]]));
  await Notification.create({
    userId: event.userId,
    kind: event.action,
    params: Object.keys(params).length ? JSON.stringify(params) : null,
  });
}

function present(row: Notification) {
  return {
    id: row.id,
    kind: row.kind,
    params: row.params ? (JSON.parse(row.params) as Record<string, unknown>) : {},
    read: Boolean(row.readAt),
    createdAt: row.createdAt,
  };
}

function routes(router: Router): void {
  router.get('/cabinet/notifications', requireUser, asyncRoute(async (req, res) => {
    const userId = userIdOf(req);
    const [rows, unread] = await Promise.all([
      Notification.findAll({ where: { userId }, order: [['id', 'DESC']], limit: 50 }),
      Notification.count({ where: { userId, readAt: null } }),
    ]);
    res.json({ notifications: rows.map(present), unread });
  }));

  /** Позначити прочитаними: `{ ids }` або всі, якщо ids не передано */
  router.post('/cabinet/notifications/read', requireUser, asyncRoute(async (req, res) => {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(parseId).filter((id: number | null) => id !== null) : null;
    await Notification.update(
      { readAt: new Date() },
      { where: { userId: userIdOf(req), readAt: null, ...(ids ? { id: { [Op.in]: ids } } : {}) } },
    );
    res.status(204).end();
  }));
}

/** Плагін сповіщень: перетворює події `activity` на сповіщення */
export const plugin: Plugin = {
  name: 'notifications',
  contour: 'platform',
  events: { activity: notify },
  routes,
};
