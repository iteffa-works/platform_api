import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { Router } from 'express';
import { findEntrypoint } from '../../shared/fs/index.js';
import { emit, on } from '../events/index.js';
import { pluginDirectories } from './discover.js';
import { registerPlugin } from './registry.js';
import type { PluginModule } from './types.js';

export type PluginRouters = {
  platform: Router;
  client: Router;
};

let started = false;

export async function loadPlugins(routers: PluginRouters): Promise<void> {
  if (started) return;

  const loaded: PluginModule[] = [];

  for (const dir of await pluginDirectories()) {
    const file = await findEntrypoint(dir);
    if (!file) continue;

    const mod = (await import(pathToFileURL(file).href)) as PluginModule;
    if (!mod.plugin?.name) throw new Error(`Плагін ${path.basename(dir)} не експортує plugin`);

    registerPlugin(mod.plugin.name, mod);
    const router = mod.plugin.contour === 'client' ? routers.client : routers.platform;
    mod.plugin.routes?.(router);

    for (const [name, handler] of Object.entries(mod.plugin.events ?? {})) {
      on(name, handler);
    }

    loaded.push(mod);
  }

  for (const mod of loaded) await mod.plugin.init?.();
  await emit('app.ready');
  started = true;
}
