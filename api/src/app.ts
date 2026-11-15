import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import { errorHandler, HttpError } from './shared/http/index.js';

/** Platform API для web: сесія в httpOnly-cookie, same-origin (Vite proxy / Nginx) */
export const platformApi = express.Router();
/** Client API для desktop/скриптів: ключ у заголовку, CORS відкритий */
export const clientApi = express.Router();

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * CSRF: змінюючі запити platform API — лише з заголовком X-Requested-With.
 * Чужий сайт не може надіслати його без CORS-preflight, а CORS для /api/v1 не відкрито.
 */
function requireAppRequest(req: Request, _res: Response, next: NextFunction): void {
  if (SAFE_METHODS.has(req.method) || req.headers['x-requested-with']) {
    next();
    return;
  }
  next(new HttpError(403, 'Запит відхилено (CSRF)'));
}

/** Збірка Express-додатку */
export function createApp() {
  const app = express();

  // За Nginx / Vite proxy: req.ip — адреса клієнта (журнал, ліміти)
  app.set('trust proxy', 'loopback');
  app.disable('x-powered-by');

  app.use(express.json({ limit: '1mb' }));
  app.use('/api/v1', requireAppRequest, platformApi);
  app.use('/api/client/v1', cors(), clientApi);
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Не знайдено' }));
  app.use(errorHandler);

  return app;
}

export const app = createApp();
