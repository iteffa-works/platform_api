import type { Router } from 'express';
import type { EventHandler } from '../events/index.js';

export type ApiContour = 'platform' | 'client';

export interface Plugin {
  name: string;
  /** platform = /api/v1 (web); client = /api/client/v1 */
  contour?: ApiContour;
  routes?: (router: Router) => void;
  events?: Record<string, EventHandler>;
  init?: () => void | Promise<void>;
}

export type PluginModule = {
  plugin: Plugin;
  isEmpty?: boolean;
} & Record<string, unknown>;
