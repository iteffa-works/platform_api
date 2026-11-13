import type { Request } from 'express';

/** Токен із заголовка `Authorization: Bearer …` */
export function readBearer(req: Request): string {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7).trim() : '';
}
