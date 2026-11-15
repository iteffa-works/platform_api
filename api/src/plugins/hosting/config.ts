/** Налаштування хостингу (env) — один обʼєкт, що передається сервісам */
import { PERIODS } from './domain/rules.js';

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
  /** Як часто фонове завдання перевіряє строки оплати, хв */
  readonly jobIntervalMinutes = Math.max(1, Number(process.env.HOSTING_JOB_INTERVAL_MINUTES || 15));
  /** Оновлювати кеш використання ресурсів не частіше, год */
  readonly usageRefreshHours = 6;
}
