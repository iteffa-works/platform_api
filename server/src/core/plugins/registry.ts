import type { PluginModule } from './types.js';

const registry = new Map<string, PluginModule>();

const missing: PluginModule = {
  isEmpty: true,
  plugin: { name: '' },
};

export function registerPlugin(name: string, mod: PluginModule): void {
  if (registry.has(name)) throw new Error(`Плагін «${name}» уже зареєстровано`);
  registry.set(name, mod);
}

export function call(name: string): PluginModule {
  return registry.get(name) ?? missing;
}

export function listPlugins(): string[] {
  return [...registry.keys()];
}
