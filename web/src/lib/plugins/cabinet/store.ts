import { writable } from 'svelte/store';
import * as cabinetApi from './api.js';
import type { BillingSummary, CabinetProfile, NotificationItem } from './api.js';

export const profile = writable<CabinetProfile | null>(null);
/** Баланс і тариф для шапки */
export const billingSummary = writable<BillingSummary | null>(null);
/** Сповіщення для дзвіночка */
export const notifications = writable<NotificationItem[]>([]);
export const unreadCount = writable(0);

export async function loadProfile(): Promise<void> {
  profile.set(await cabinetApi.fetchProfile());
}

export async function loadBillingSummary(): Promise<void> {
  billingSummary.set(await cabinetApi.fetchBillingSummary());
}

export async function loadNotifications(): Promise<void> {
  const data = await cabinetApi.fetchNotifications();
  notifications.set(data.notifications);
  unreadCount.set(data.unread);
}

/** Дані будь-якої сторінки кабінету: профіль + шапка (баланс, сповіщення) */
export async function loadCabinet(): Promise<void> {
  await Promise.all([loadProfile(), loadBillingSummary(), loadNotifications()]);
}

export async function readNotifications(ids?: number[]): Promise<void> {
  await cabinetApi.markNotificationsRead(ids);
  await loadNotifications();
}
