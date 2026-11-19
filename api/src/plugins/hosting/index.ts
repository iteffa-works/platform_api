/**
 * Плагін «Хостинг»: тарифи, замовлення й продовження з балансу, керування акаунтами
 * і копія даних панелей у БД із синхронізацією (провайдер: ISPmanager 6).
 * Звʼязок з платформою — лише порти (flowaxy/services) і хуки (flowaxy/hooks).
 *
 * Структура:
 *   module.ts     — корінь композиції (сервіси)      config.ts — налаштування (env)
 *   domain/       — моделі й чисті правила            providers/ — контракт панелі та реалізації
 *   services/     — бізнес-логіка (класи)             http/     — REST-маршрути
 *   ui/           — сторінки (server-driven UI)       hooks.ts  — хуки й підписники
 */
import type { Plugin } from '../../flowaxy/plugins/index.js';
import { registerHostingSubscribers } from './hooks.js';
import { registerHostingDashboard } from './ui/dashboard.js';
import { createRoutes } from './http/index.js';
import { hosting } from './module.js';
import { hostingUi } from './ui/index.js';

export const plugin: Plugin = {
  name: 'hosting',
  title: 'Хостинг',
  description: 'Віртуальний хостинг: тарифи, замовлення з балансу, керування акаунтами й серверами, ресурси клієнта в кабінеті (ISPmanager 6)',
  version: '0.4.0',
  contour: 'platform',
  permissions: {
    hosting: { label: 'Хостинг', levels: ['view', 'manage'] },
  },
  ui: hostingUi,
  routes: createRoutes(hosting),
  init() {
    registerHostingSubscribers();
    registerHostingDashboard();
    hosting.lifecycle.start();
  },
  // Після увімкнення — одразу перевірити строки (могли минути, поки плагін був вимкнений)
  onEnable: () => {
    setTimeout(() => void hosting.lifecycle.run(), 5_000).unref();
  },
};
