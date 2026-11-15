import type { Request } from 'express';

/** Значення cookie з заголовка запиту (без сторонніх парсерів) */
export function readCookie(req: Request, name: string): string {
  for (const part of String(req.headers.cookie || '').split(';')) {
    const index = part.indexOf('=');
    if (index > 0 && part.slice(0, index).trim() === name) {
      try {
        return decodeURIComponent(part.slice(index + 1).trim());
      } catch {
        return '';
      }
    }
  }
  return '';
}
