import type { Writable } from 'svelte/store';

/** Текст помилки для UI */
export function errorMessage(err: unknown, fallback = 'Помилка'): string {
  return err instanceof Error ? err.message : fallback;
}

type RunOptions = { rethrow?: boolean };

/** Обгортка дій store: скидає помилку, тримає busy, ловить виняток у error */
export function createRunner(busy: Writable<boolean>, error: Writable<string>) {
  return async function run(action: () => Promise<void>, { rethrow = false }: RunOptions = {}): Promise<void> {
    error.set('');
    busy.set(true);
    try {
      await action();
    } catch (err) {
      error.set(errorMessage(err));
      if (rethrow) throw err;
    } finally {
      busy.set(false);
    }
  };
}
