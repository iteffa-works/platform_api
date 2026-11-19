import { HttpError } from '../../../shared/http/index.js';
import { PanelError } from '../providers/contracts.js';

/** Виклик панелі: PanelError → 502 з текстом панелі (без облікових даних і деталей запиту) */
export async function panelCall<T>(action: () => Promise<T>): Promise<T> {
  try {
    return await action();
  } catch (error) {
    if (error instanceof PanelError) throw new HttpError(502, `Панель хостингу: ${error.message}`);
    throw error;
  }
}

export type Settled<T> = { ok: true; value: T } | { ok: false; error: string };

/** Незалежна частина запиту до панелі: збій однієї не ховає інші (огляд сервера, синхронізація) */
export async function settle<T>(fn: () => Promise<T>): Promise<Settled<T>> {
  try {
    return { ok: true, value: await fn() };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/** Помилка «службова» (панель, HTTP-відповідь) — не зупиняє фонове завдання */
export function isExpectedError(error: unknown): boolean {
  return error instanceof PanelError || (error instanceof Error && 'status' in error);
}
