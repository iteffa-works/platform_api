import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../errors/http-error.js';
import { pickLanguage, translate } from '../i18n/messages.js';

/** Помилки → JSON `{ error }` мовою з Accept-Language; 500 — без деталей назовні */
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction): void {
  if (res.headersSent) {
    next(err);
    return;
  }

  // Express (raw/json) кидає помилки з власним статусом: завеликий / битий запит
  const status = err instanceof HttpError
    ? err.status
    : (err as { status?: number }).status === 413 ? 413
      : (err as { type?: string }).type === 'entity.parse.failed' ? 400
        : 500;
  if (status === 500) console.error(err);

  const message = err instanceof HttpError
    ? err.message
    : status === 413 ? 'Запит завеликий'
      : status === 400 ? 'Некоректний запит'
        : 'Внутрішня помилка';
  res.status(status).json({ error: translate(message, pickLanguage(req.headers['accept-language'])) });
}
