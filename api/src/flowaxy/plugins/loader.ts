import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { Router, type NextFunction, type Request, type Response } from 'express';
import { findEntrypoint } from '../fs.js';
import { registerResources } from '../access/index.js';
import { emit, on } from '../events/index.js';
import { registerUi } from '../ui/index.js';
import { isPluginDirectory, pluginDirectories } from './discover.js';
import { isEnabled, loadStates, registerPlugin } from './registry.js';
import type { Plugin, PluginModule } from './types.js';

export type PluginRouters = {
  platform: Router;
  client: Router;
};

let started = false;

/** Маршрути плагіна — окремий router за «воротами»: вимкнений плагін пропускає запит далі (→ 404) */
function mountRoutes(plugin: Plugin, isPlugin: boolean, target: Router): void {
  if (!plugin.routes) return;
  if (!isPlugin) {
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

/** Підписки `plugin.events` — дії хуків; плагіни діють лише поки увімкнено */
function subscribe(plugin: Plugin, isPlugin: boolean): void {
  for (const [name, handler] of Object.entries(plugin.events ?? {})) {
    on(name, handler, { owner: plugin.name, when: isPlugin ? () => isEnabled(plugin.name) : undefined });
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

    const isPlugin = isPluginDirectory(dir);
    registerPlugin(mod.plugin, isPlugin ? 'plugin' : 'extension');
    // Права плагіна реєструються завжди: ролі зберігають рівні, поки плагін вимкнено
    registerResources(mod.plugin.permissions ?? {});
    mountRoutes(mod.plugin, isPlugin, mod.plugin.contour === 'client' ? routers.client : routers.platform);
    subscribe(mod.plugin, isPlugin);
    if (mod.plugin.ui) registerUi(mod.plugin.name, mod.plugin.ui);
    loaded.push(mod.plugin);
  }

  await loadStates();
  // Збій init одного плагіна не зупиняє застосунок — у лог
  for (const plugin of loaded) {
    try {
      await plugin.init?.();
    } catch (error) {
      console.error(`[plugins] init ${plugin.name}`, error);
    }
  }
  await emit('app.ready');
  started = true;
}
