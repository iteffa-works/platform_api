/**
 * Плагін «Хостинг»: тарифи, замовлення й продовження з балансу, керування акаунтами
 * і повна консоль панелей (провайдери: ISPmanager 6, Sandbox).
 *
 * Структура:
 *   module.ts     — корінь композиції (сервіси)      config.ts — налаштування (env)
 *   domain/       — моделі й чисті правила            providers/ — контракт панелі та реалізації
 *   services/     — бізнес-логіка (класи)             http/     — REST-маршрути
 *   ui/           — сторінки (server-driven UI)       hooks.ts  — хуки й підписники
 */
import type { Plugin } from '../../core/plugins/index.js';
import { registerHostingSubscribers } from './hooks.js';
import { createRoutes } from './http/index.js';
import { hosting } from './module.js';
import { hostingUi } from './ui/index.js';

export const plugin: Plugin = {
  name: 'hosting',
  title: 'Хостинг',
  description: 'Віртуальний хостинг: тарифи, замовлення з балансу, керування акаунтами й повна консоль панелей (ISPmanager 6, Sandbox)',
  version: '0.3.0',
  contour: 'platform',
  permissions: {
    hosting: { label: 'Хостинг', levels: ['view', 'manage'] },
  },
  ui: hostingUi,
  routes: createRoutes(hosting),
  init() {
    registerHostingSubscribers();
    hosting.lifecycle.start();
  },
  // Після увімкнення — одразу перевірити строки (могли минути, поки плагін був вимкнений)
  onEnable: () => {
    setTimeout(() => void hosting.lifecycle.run(), 5_000).unref();
  },
};
