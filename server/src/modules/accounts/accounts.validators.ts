import { HttpError } from '../../shared/http/index.js';

export function readLabel(value: unknown): string {
  const label = String(value || '').trim();
  if (!label || label.length > 80) throw new HttpError(400, 'Вкажіть назву акаунта');
  return label;
}

export function readApiId(value: unknown): number {
  const apiId = Number(value);
  if (!Number.isInteger(apiId) || apiId <= 0) throw new HttpError(400, 'Некоректний api_id');
  return apiId;
}

export function readApiHash(value: unknown): string {
  const apiHash = String(value || '').trim();
  if (apiHash.length < 16 || apiHash.length > 128) throw new HttpError(400, 'Некоректний api_hash');
  return apiHash;
}
