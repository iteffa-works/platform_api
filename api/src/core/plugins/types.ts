import type { Router } from 'express';
import type { PermissionCatalog } from '../access/index.js';
import type { EventHandler } from '../events/index.js';

export type ApiContour = 'platform' | 'client';

export interface Plugin {
  name: string;
  /** platform = /api/v1 (web); client = /api/client/v1 */
  contour?: ApiContour;
  /** Ресурси для ролей: зʼявляються в матриці прав адмінки */
  permissions?: PermissionCatalog;
  routes?: (router: Router) => void;
  events?: Record<string, EventHandler>;
  init?: () => void | Promise<void>;
}

export type PluginModule = {
  plugin: Plugin;
};
