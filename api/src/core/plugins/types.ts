import type { Router } from 'express';
import type { PermissionCatalog } from '../access/index.js';
import type { EventHandler } from '../events/index.js';
import type { PluginUi } from '../ui/index.js';

export type ApiContour = 'platform' | 'client';

/** core — `modules/*`, завжди увімкнені; addon — `plugins/*`, вмикаються в адмінці */
export type PluginKind = 'core' | 'addon';

export interface Plugin {
  name: string;
  /** Назва й опис для списку плагінів в адмінці */
  title?: string;
  description?: string;
  version?: string;
  /** Лише addon: стан при першому виявленні (за замовчуванням вимкнено) */
  defaultEnabled?: boolean;
  /** platform = /api/v1 (web); client = /api/client/v1 */
  contour?: ApiContour;
  /** Ресурси для ролей: зʼявляються в матриці прав адмінки */
  permissions?: PermissionCatalog;
  /**
   * Інтерфейс плагіна (server-driven UI): сторінки, меню, сервіси, переклади.
   * Web рендерить схему універсальним конструктором — коду плагіна в web немає.
   */
  ui?: PluginUi;
  /** Маршрути addon діють лише поки плагін увімкнено (інакше — 404) */
  routes?: (router: Router) => void;
  /** Обробники addon викликаються лише поки плагін увімкнено */
  events?: Record<string, EventHandler>;
  /** Один раз після завантаження всіх плагінів (незалежно від стану addon) */
  init?: () => void | Promise<void>;
  /** Addon увімкнули / вимкнули в адмінці; помилка скасовує зміну */
  onEnable?: () => void | Promise<void>;
  onDisable?: () => void | Promise<void>;
}

export type PluginModule = {
  plugin: Plugin;
};
