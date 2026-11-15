import { derived, writable, type Writable } from 'svelte/store';

/** Текст помилки для UI (повідомлення API вже перекладене за Accept-Language) */
export function errorMessage(err: unknown, fallback = 'Error'): string {
  return err instanceof Error ? err.message : fallback;
}

/** Часовий пояс показу дат: з налаштувань акаунта; undefined — пояс браузера */
export const timeZone = writable<string | undefined>(undefined);

/** Локаль дат (BCP 47) — оновлює i18n при зміні мови */
export const dateLocale = writable('uk-UA');

/**
 * Форматери дат з урахуванням мови й поясу: `$formatDate(value)`, `$formatDateTime(value)`.
 * Store — щоб дати на екрані оновлювались одразу після зміни мови / поясу.
 */
export const formatDate = derived([dateLocale, timeZone], ([$locale, $timeZone]) => {
  const format = new Intl.DateTimeFormat($locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: $timeZone });
  return (value: string | Date): string => format.format(new Date(value));
});

export const formatDateTime = derived([dateLocale, timeZone], ([$locale, $timeZone]) => {
  const format = new Intl.DateTimeFormat($locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: $timeZone });
  return (value: string | Date): string => format.format(new Date(value));
});

/** Гроші: «12.50» + код валюти → локалізований рядок */
export const formatMoney = derived(dateLocale, ($locale) => (amount: string, currency: string): string =>
  new Intl.NumberFormat($locale, { style: 'currency', currency }).format(Number(amount)));

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

/** Короткий опис пристрою з User-Agent: «Chrome · Windows» */
export function describeAgent(agent: string | null | undefined): string {
  if (!agent) return '—';
  const browser = /Edg\//.test(agent) ? 'Edge'
    : /OPR\//.test(agent) ? 'Opera'
      : /Firefox\//.test(agent) ? 'Firefox'
        : /Chrome\//.test(agent) ? 'Chrome'
          : /Safari\//.test(agent) ? 'Safari'
            : /curl|node|undici|python|httpx/i.test(agent) ? 'API'
              : 'Browser';
  const os = /Windows/.test(agent) ? 'Windows'
    : /Android/.test(agent) ? 'Android'
      : /iPhone|iPad|iOS/.test(agent) ? 'iOS'
        : /Mac OS X|Macintosh/.test(agent) ? 'macOS'
          : /Linux/.test(agent) ? 'Linux'
            : '';
  return os ? `${browser} · ${os}` : browser;
}
