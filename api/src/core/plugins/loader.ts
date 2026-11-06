import { access } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { Router } from 'express';
import { emit, on } from '../events/index.js';
import { pluginDirectories } from './discover.js';
import { registerPlugin } from './registry.js';
import type { PluginModule } from './types.js';

export type PluginRouters = {
  platform: Router;
  client: Router;
};

async function exists(file: string): Promise<boolean> {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

async function entrypoint(dir: string): Promise<string | undefined> {
  const typescript = path.join(dir, 'index.ts');
  const javascript = path.join(dir, 'index.js');
  if (await exists(typescript)) return typescript;
  if (await exists(javascript)) return javascript;
  return undefined;
}

let started = false;

export async function loadPlugins(routers: PluginRouters): Promise<void> {
  if (started) return;

  const loaded: PluginModule[] = [];

  for (const dir of await pluginDirectories()) {
    const file = await entrypoint(dir);
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
