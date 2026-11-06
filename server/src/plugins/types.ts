import type { Router } from 'express';

export type PluginEventHandler = (...args: any[]) => void | Promise<void>;

export interface Plugin {
  name: string;
  routes?: (router: Router) => void;
  events?: Record<string, PluginEventHandler>;
  init?: () => void | Promise<void>;
}

export type PluginModule = {
  plugin: Plugin;
  isEmpty?: boolean;
} & Record<string, unknown>;
