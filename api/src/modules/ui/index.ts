import type { Request, Router } from 'express';
import { isEnabled, type Plugin } from '../../core/plugins/index.js';
import { can, type Permissions } from '../../core/access/index.js';
import { manifest, matchPage, translator, type Language } from '../../core/ui/index.js';
import { asyncRoute, HttpError } from '../../shared/http/index.js';
import { pickLanguage } from '../../shared/i18n/messages.js';
import { userIdOf } from '../../shared/middleware/index.js';
import { permissionsOf, requireUser } from '../auth/access.js';
import { findSession } from '../auth/sessions.js';

function languageOf(req: Request): Language {
  return pickLanguage(req.headers['accept-language']);
}

/** Права гостя — null; сесія необовʼязкова (маніфест потрібен і публічним сторінкам) */
async function optionalPermissions(req: Request): Promise<Permissions | null> {
  const session = await findSession(req);
  if (!session) return null;
  req.userId = session.userId;
  req.sessionId = session.id;
  return permissionsOf(req);
}

function readState(input: unknown): Record<string, string> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  const entries = Object.entries(input as Record<string, unknown>).slice(0, 50);
  return Object.fromEntries(entries.map(([key, value]) => [key.slice(0, 64), String(value ?? '').slice(0, 500)]));
}

function routes(router: Router): void {
  /** Меню, сервіси, маршрути й переклади сторінок плагінів (лише увімкнені й дозволені) */
  router.get('/ui/manifest', asyncRoute(async (req, res) => {
    res.json(manifest(isEnabled, await optionalPermissions(req), languageOf(req)));
  }));

  /** Схема сторінки з даними: `{ path, state }` → `{ nodes }` */
  router.post('/ui/page', requireUser, asyncRoute(async (req, res) => {
    const path = String(req.body?.path ?? '');
    const found = matchPage(path, isEnabled);
    if (!found) throw new HttpError(404, 'Не знайдено');
    const permissions = await permissionsOf(req);
    if (found.page.permission && !can(permissions, ...found.page.permission)) throw new HttpError(403, 'Недостатньо прав');

    const lang = languageOf(req);
    const nodes = await found.page.render({
      req,
      userId: userIdOf(req),
      lang,
      params: found.params,
      state: readState(req.body?.state),
      t: translator(found.ui.messages, lang),
      can: (resource, level) => can(permissions, resource, level),
    });
    res.json({ nodes });
  }));
}

/** Server-driven UI: маніфест і рендер сторінок плагінів для конструктора web */
export const plugin: Plugin = {
  name: 'ui',
  title: 'Конструктор інтерфейсу',
  contour: 'platform',
  routes,
};
