import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../errors/http-error.js';

export function errorHandler(err: unknown, _req: Request, res: Response, next: NextFunction): void {
  if (res.headersSent) {
    next(err);
    return;
  }
  const status = err instanceof HttpError ? err.status : 500;
  if (status === 500) console.error(err);
  res.status(status).json({
    error: status === 500 ? 'Внутрішня помилка' : (err as Error).message,
  });
}
