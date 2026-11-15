import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { Router, type NextFunction, type Request, type Response } from 'express';
import { findEntrypoint } from '../../shared/fs/index.js';
import { registerResources } from '../access/index.js';
import { emit, on, type EventHandler } from '../events/index.js';
import { isAddonDirectory, pluginDirectories } from './discover.js';
import { isEnabled, loadStates, registerPlugin } from './registry.js';
import type { Plugin, PluginModule } from './types.js';

export type PluginRouters = {
  platform: Router;
  client: Router;
};

let started = false;

/** Маршрути addon — окремий router за «воротами»: вимкнений плагін пропускає запит далі (→ 404) */
function mountRoutes(plugin: Plugin, addon: boolean, target: Router): void {
  if (!plugin.routes) return;
  if (!addon) {
    plugin.routes(target);
    return;
  }
  const own = Router();
  plugin.routes(own);
  target.use((req: Request, res: Response, next: NextFunction) => {
    if (isEnabled(plugin.name)) own(req, res, next);
    else next();
  });
}

function subscribe(plugin: Plugin, addon: boolean): void {
  for (const [name, handler] of Object.entries(plugin.events ?? {})) {
    const gated: EventHandler = addon
      ? (payload) => (isEnabled(plugin.name) ? handler(payload) : undefined)
      : handler;
    on(name, gated);
  }
}

export async function loadPlugins(routers: PluginRouters): Promise<void> {
  if (started) return;

  const loaded: Plugin[] = [];

  for (const dir of await pluginDirectories()) {
    const file = await findEntrypoint(dir);
    if (!file) continue;

    const mod = (await import(pathToFileURL(file).href)) as PluginModule;
    if (!mod.plugin?.name) throw new Error(`Плагін ${path.basename(dir)} не експортує plugin`);

    const addon = isAddonDirectory(dir);
    registerPlugin(mod.plugin, addon ? 'addon' : 'core');
    // Права addon реєструються завжди: ролі зберігають рівні, поки плагін вимкнено
    registerResources(mod.plugin.permissions ?? {});
    mountRoutes(mod.plugin, addon, mod.plugin.contour === 'client' ? routers.client : routers.platform);
    subscribe(mod.plugin, addon);
    loaded.push(mod.plugin);
  }

  await loadStates();
  for (const plugin of loaded) await plugin.init?.();
  await emit('app.ready');
  started = true;
}
