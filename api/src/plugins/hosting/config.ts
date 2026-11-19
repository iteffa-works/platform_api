/** Налаштування хостингу (env) — один обʼєкт, що передається сервісам */
import { PERIODS } from './domain/rules.js';

const minutes = (name: string, fallback: number) => Math.max(1, Number(process.env[name] || fallback));

export class HostingConfig {
  /** Дозволені строки оплати, міс. */
  readonly periods: readonly number[] = PERIODS;
  /** Нагадування про закінчення оплати за N днів */
  readonly remindDays = 3;
  /**
   * Через скільки днів після блокування за несплату видаляти акаунт у панелі.
   * 0 — ніколи (автоматичне видалення даних клієнта — лише свідомо).
   */
  readonly deleteAfterDays = Math.max(0, Number(process.env.HOSTING_DELETE_AFTER_DAYS || 0));
  /** Фонове завдання: строки оплати й синхронізація копії даних панелей, хв */
  readonly jobIntervalMinutes = minutes('HOSTING_JOB_INTERVAL_MINUTES', 10);
}
