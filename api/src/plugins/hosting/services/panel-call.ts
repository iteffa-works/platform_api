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
