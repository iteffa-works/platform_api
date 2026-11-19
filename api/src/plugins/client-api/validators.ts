import { HttpError } from '../../shared/http/index.js';
import type { WorkResult } from './service.js';

export function readWorkResult(body: unknown): WorkResult {
  const data = (body ?? {}) as { status?: unknown; data?: unknown; error?: unknown };
  const status = data.status;
  if (status !== 'done' && status !== 'failed') {
    throw new HttpError(400, 'status має бути done або failed');
  }
  return {
    status,
    data: data.data && typeof data.data === 'object' ? data.data as Record<string, unknown> : undefined,
    error: data.error !== undefined ? String(data.error) : undefined,
  };
}
