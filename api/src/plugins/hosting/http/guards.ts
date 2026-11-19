/** Доступ, розбір параметрів і обгортки маршрутів хостингу — в одному місці */
import type { Request, RequestHandler } from 'express';
import { guards } from '../../../flowaxy/services/index.js';
import { asyncRoute, readIdParam } from '../../../shared/http/index.js';
import { userIdOf } from '../../../shared/middleware/index.js';

const admin = [guards.user, guards.permission('admin.panel', 'view')];

/** Набори middleware (перевірки — порт `access` платформи): кожен маршрут сам перевіряє доступ */
export const guard: Record<'user' | 'view' | 'manage', RequestHandler[]> = {
  user: [guards.user],
  view: [...admin, guards.permission('hosting', 'view')],
  manage: [...admin, guards.permission('hosting', 'manage')],
};

export const params = {
  id: (req: Request, notFound = 'Не знайдено') => readIdParam(req.params.id, notFound),
  server: (req: Request) => readIdParam(req.params.id, 'Сервер не знайдено'),
  plan: (req: Request) => readIdParam(req.params.id, 'Тариф не знайдено'),
  account: (req: Request) => readIdParam(req.params.id, 'Хостинг-акаунт не знайдено'),
  /** Текстовий ключ обʼєкта панелі (імʼя, адреса, ключ запису) */
  key: (req: Request) => String(req.params.key ?? req.body?.key ?? '').slice(0, 512),
};

export const body = (req: Request): Record<string, unknown> => (req.body && typeof req.body === 'object' ? req.body : {});
export const actor = (req: Request) => ({ req, actorId: userIdOf(req) });

/** Обробник: результат → JSON, `undefined` → 204 */
export function json(handler: (req: Request) => Promise<unknown>, status = 200): RequestHandler {
  return asyncRoute(async (req, res) => {
    const result = await handler(req);
    if (result === undefined) res.status(204).end();
    else res.status(status).json(result);
  });
}

/** Те саме з кодом 201 (створення) */
export const created = (handler: (req: Request) => Promise<unknown>) => json(handler, 201);
