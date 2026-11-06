import type { Router } from 'express';
import type { EventHandler } from '../events/index.js';

export interface Plugin {
  name: string;
  routes?: (router: Router) => void;
  events?: Record<string, EventHandler>;
  init?: () => void | Promise<void>;
}

export type PluginModule = {
  plugin: Plugin;
  isEmpty?: boolean;
} & Record<string, unknown>;
