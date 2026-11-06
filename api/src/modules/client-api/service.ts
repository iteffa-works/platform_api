import { randomUUID } from 'node:crypto';
import { emit } from '../../core/events/index.js';
import { HttpError } from '../../shared/http/index.js';

export type WorkItem = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  createdAt: string;
};

export type WorkResult = {
  status: 'done' | 'failed';
  data?: Record<string, unknown>;
  error?: string;
};

/** In-memory черга для скелета (далі — БД / модулі) */
const queue: WorkItem[] = [];
const claimed = new Map<string, WorkItem>();

export function enqueueDemo(type = 'demo', payload: Record<string, unknown> = {}): WorkItem {
  const item: WorkItem = {
    id: randomUUID(),
    type,
    payload,
    createdAt: new Date().toISOString(),
  };
  queue.push(item);
  return item;
}

export async function claimNext(): Promise<WorkItem | null> {
  const item = queue.shift() ?? null;
  if (!item) return null;
  claimed.set(item.id, item);
  await emit('client.work.claimed', { workId: item.id, type: item.type });
  return item;
}

export async function submitResult(id: string, result: WorkResult): Promise<{ ok: true; id: string }> {
  const item = claimed.get(id);
  if (!item) throw new HttpError(404, 'Завдання не знайдено або вже закрите');
  if (result.status !== 'done' && result.status !== 'failed') {
    throw new HttpError(400, 'status має бути done або failed');
  }
  claimed.delete(id);
  await emit('client.work.completed', { workId: id, status: result.status });
  return { ok: true, id };
}

export function clientStatus() {
  return {
    ok: true,
    contour: 'client' as const,
    queue: queue.length,
    claimed: claimed.size,
  };
}
