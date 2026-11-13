import { derived, writable, type Writable } from 'svelte/store';

/** Текст помилки для UI */
export function errorMessage(err: unknown, fallback = 'Помилка'): string {
  return err instanceof Error ? err.message : fallback;
}

/** Часовий пояс показу дат: з налаштувань акаунта; undefined — пояс браузера */
export const timeZone = writable<string | undefined>(undefined);

/**
 * Форматер дат з урахуванням поясу: `$formatDate(value)`.
 * Store — щоб дати на екрані оновлювались одразу після зміни поясу.
 */
export const formatDate = derived(timeZone, ($timeZone) => {
  const format = new Intl.DateTimeFormat('uk-UA', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: $timeZone,
  });
  return (value: string | Date): string => format.format(new Date(value));
});

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
