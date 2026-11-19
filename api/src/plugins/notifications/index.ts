import type { Router } from 'express';
import { Op } from 'sequelize';
import type { ActivityEvent } from '../../flowaxy/activity/index.js';
import type { Plugin } from '../../flowaxy/plugins/index.js';
import { asyncRoute, parseId } from '../../shared/http/index.js';
import { userIdOf } from '../../shared/middleware/index.js';
import { guards, provide } from '../../flowaxy/services/index.js';
import { Notification } from './model.js';
import * as preferences from './settings.js';

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

/**
 * Дозволити плагіну власні сповіщення: `action` події → параметри з `meta`.
 * Текст — переклад `notification.<action>` у web-плагіні.
 */
export function registerNotification(action: string, keys: string[] = []): void {
  NOTIFY[action] = keys;
}

async function notify(payload?: unknown): Promise<void> {
  const event = payload as ActivityEvent;
  const keys = NOTIFY[event.action];
  if (!keys || !(await preferences.allowed(event.userId, event.action))) return;
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
  router.get('/cabinet/notifications', guards.user, asyncRoute(async (req, res) => {
    const userId = userIdOf(req);
    const [rows, unread] = await Promise.all([
      Notification.findAll({ where: { userId }, order: [['id', 'DESC']], limit: 50 }),
      Notification.count({ where: { userId, readAt: null } }),
    ]);
    res.json({ notifications: rows.map(present), unread });
  }));

  /** Групи сповіщень: які типи подій користувач отримує */
  router.get('/cabinet/notifications/settings', guards.user, asyncRoute(async (req, res) => {
    res.json(await preferences.settings(userIdOf(req)));
  }));

  router.put('/cabinet/notifications/settings', guards.user, asyncRoute(async (req, res) => {
    res.json(await preferences.updateSettings(userIdOf(req), req.body));
  }));

  /** Позначити прочитаними: `{ ids }` або всі, якщо ids не передано */
  router.post('/cabinet/notifications/read', guards.user, asyncRoute(async (req, res) => {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(parseId).filter((id: number | null) => id !== null) : null;
    await Notification.update(
      { readAt: new Date() },
      { where: { userId: userIdOf(req), readAt: null, ...(ids ? { id: { [Op.in]: ids } } : {}) } },
    );
    res.status(204).end();
  }));
}

// Порт для плагінів: власні сповіщення без імпорту модуля
provide('notifications', { register: registerNotification }, 'notifications');

/** Плагін сповіщень: перетворює події `activity` на сповіщення */
export const plugin: Plugin = {
  name: 'notifications',
  title: 'Сповіщення',
  description: 'Сповіщення користувачу з подій журналу',
  defaultEnabled: true,
  contour: 'platform',
  events: { activity: notify },
  routes,
};
