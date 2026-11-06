import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { Model, type ModelStatic } from 'sequelize';
import { pluginDirectories } from '../plugins/discover.js';
import { models, type Models } from './registry.js';

type ModelModule = Record<string, unknown> & {
  associate?: (registry: Models) => void;
};

function isModelClass(value: unknown): value is ModelStatic<Model> {
  return typeof value === 'function' && value.prototype instanceof Model;
}

function isModelFile(name: string, names: ReadonlySet<string>): boolean {
  if (name.startsWith('.') || name.endsWith('.d.ts')) return false;
  if (name === 'index.ts' || name === 'index.js') return false;
  if (name.endsWith('.test.ts') || name.endsWith('.spec.ts')) return false;
  if (name.endsWith('.ts')) return true;
  return name.endsWith('.js') && !names.has(name.replace(/\.js$/, '.ts'));
}

let loaded = false;

export async function loadModels(): Promise<void> {
  if (loaded) return;

  const associates: Array<(registry: Models) => void> = [];

  try {
    const files: string[] = [];

    for (const dir of await pluginDirectories()) {
      let entries: string[];
      try {
        entries = await readdir(path.join(dir, 'models'));
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') continue;
        throw error;
      }

      const names = new Set(entries);
      for (const name of entries) {
        if (!isModelFile(name, names)) continue;
        files.push(path.join(dir, 'models', name));
      }
    }

    files.sort((left, right) => left.localeCompare(right));

    for (const file of files) {
      const imported = (await import(pathToFileURL(file).href)) as ModelModule;
      for (const value of Object.values(imported)) {
        if (!isModelClass(value)) continue;
        if (models[value.name]) throw new Error(`Модель ${value.name} оголошена двічі`);
        models[value.name] = value;
      }
      if (typeof imported.associate === 'function') associates.push(imported.associate);
    }

    for (const associate of associates) associate(models);
    loaded = true;
  } catch (error) {
    for (const key of Object.keys(models)) delete models[key];
    throw error;
  }
}
