import type { TranslateDynamic } from '$lib/i18n';
import type { NotificationItem } from './api.js';

/** Текст сповіщення мовою інтерфейсу: ключ `notification.<kind>` + параметри */
export function notificationText(tx: TranslateDynamic, item: NotificationItem): string {
  return tx(`notification.${item.kind}`, item.kind, item.params);
}
