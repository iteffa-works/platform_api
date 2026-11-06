import { HttpError } from '../../shared/http/index.js';

export function readLabel(value: unknown): string {
  const label = String(value || '').trim();
  if (label.length < 1 || label.length > 80) {
    throw new HttpError(400, 'Назва акаунта: 1–80 символів');
  }
  return label;
}

export function readApiId(value: unknown): number {
  const apiId = Number(value);
  if (!Number.isInteger(apiId) || apiId <= 0) {
    throw new HttpError(400, 'Некоректний apiId');
  }
  return apiId;
}

export function readApiHash(value: unknown): string {
  const apiHash = String(value || '').trim();
  if (apiHash.length < 8 || apiHash.length > 128) {
    throw new HttpError(400, 'Некоректний apiHash');
  }
  return apiHash;
}
