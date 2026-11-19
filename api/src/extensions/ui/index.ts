import type { Request, Router } from 'express';
import { isEnabled, type Plugin } from '../../flowaxy/plugins/index.js';
import { can, type Permissions } from '../../flowaxy/access/index.js';
import { manifest, matchPage, translator, type Language } from '../../flowaxy/ui/index.js';
import { asyncRoute, HttpError } from '../../shared/http/index.js';
import { cabinetHome, messages } from './home.js';
import { pickLanguage } from '../../shared/i18n/messages.js';
import { userIdOf } from '../../shared/middleware/index.js';
import { guards, use } from '../../flowaxy/services/index.js';

function languageOf(req: Request): Language {
  return pickLanguage(req.headers['accept-language']);
}

/** Права гостя — null; сесія необовʼязкова (маніфест потрібен і публічним сторінкам); auth вимкнено — як гість */
async function optionalPermissions(req: Request): Promise<Permissions | null> {
  try {
    return await use('access').sessionPermissions(req);
  } catch (error) {
    if (error instanceof HttpError && error.status === 503) return null;
    throw error;
  }
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
  router.post('/ui/page', guards.user, asyncRoute(async (req, res) => {
    const path = String(req.body?.path ?? '');
    const found = matchPage(path, isEnabled);
    if (!found) throw new HttpError(404, 'Не знайдено');
    const permissions = await use('access').permissionsOf(req);
    if (found.page.permission && !can(permissions, ...found.page.permission)) throw new HttpError(403, 'Недостатньо прав');
    // Будь-яка сторінка адмінки (чийого б плагіна) — лише з доступом до адмінки
    if (found.page.section === 'admin' && !can(permissions, 'admin.panel', 'view')) throw new HttpError(403, 'Недостатньо прав');

    const lang = languageOf(req);
    const rendered = await found.page.render({
      req,
      userId: userIdOf(req),
      lang,
      params: found.params,
      state: readState(req.body?.state),
      t: translator(found.ui.messages, lang),
      can: (resource, level) => can(permissions, resource, level),
    });
    res.json(Array.isArray(rendered) ? { nodes: rendered } : rendered);
  }));
}

/** Server-driven UI: маніфест і рендер сторінок плагінів для конструктора web */
export const plugin: Plugin = {
  name: 'ui',
  title: 'Конструктор інтерфейсу',
  contour: 'platform',
  // Головна кабінету — оболонка для внесків плагінів (ui.dashboard)
  ui: { messages, pages: [cabinetHome] },
  routes,
};
