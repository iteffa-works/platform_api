/** Доступ і розбір параметрів для маршрутів хостингу — в одному місці */
import type { Request } from 'express';
import { requirePermission, requireUser } from '../../../modules/auth/access.js';
import { readIdParam } from '../../../shared/http/index.js';
import { userIdOf } from '../../../shared/middleware/index.js';
import type { Actor } from '../services/panel.service.js';

const admin = [requireUser, requirePermission('admin.panel', 'view')];

/** Набори middleware: кожен маршрут сам перевіряє доступ (порядок плагінів не гарантує спільний) */
export const guard = {
  user: [requireUser],
  view: [...admin, requirePermission('hosting', 'view')],
  manage: [...admin, requirePermission('hosting', 'manage')],
};

export const params = {
  server: (req: Request) => readIdParam(req.params.id, 'Сервер не знайдено'),
  plan: (req: Request) => readIdParam(req.params.id, 'Тариф не знайдено'),
  account: (req: Request) => readIdParam(req.params.id, 'Хостинг-акаунт не знайдено'),
  /** Текстовий ключ обʼєкта панелі (імʼя, адреса, ключ запису) */
  key: (req: Request) => String(req.params.key ?? req.body?.key ?? '').slice(0, 512),
  /** Власник з query / body: дія від імені користувача панелі */
  owner: (req: Request) => {
    const owner = String(req.query.owner ?? req.body?.owner ?? '').trim();
    return owner || undefined;
  },
};

export const actor = (req: Request): Actor => ({ req, actorId: userIdOf(req) });
export const body = (req: Request): Record<string, unknown> => (req.body && typeof req.body === 'object' ? req.body : {});
