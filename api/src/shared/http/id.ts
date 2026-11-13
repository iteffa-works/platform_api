import { HttpError } from '../errors/http-error.js';

/** Ідентифікатор запису: додатне ціле (з URL — рядок, з JSON — число) */
export function parseId(value: unknown): number | null {
  const id = typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;
  return typeof id === 'number' && Number.isSafeInteger(id) && id > 0 ? id : null;
}

/** id з URL: некоректний = запису немає */
export function readIdParam(value: unknown, notFound = 'Не знайдено'): number {
  const id = parseId(value);
  if (id === null) throw new HttpError(404, notFound);
  return id;
}
