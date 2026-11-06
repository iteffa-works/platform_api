import { access, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { registerAuthExtension } from './registry.js';
import type { AuthExtensionModule } from './types.js';

const extensionsRoot = path.dirname(fileURLToPath(import.meta.url));

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

let loaded = false;

/** Автозавантаження підпапок auth/extensions (кожна — index.ts) */
export async function loadAuthExtensions(): Promise<void> {
  if (loaded) return;

  let entries;
  try {
    entries = await readdir(extensionsRoot, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      loaded = true;
      return;
    }
    throw error;
  }

  const dirs = entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => path.join(extensionsRoot, entry.name))
    .sort((left, right) => path.basename(left).localeCompare(path.basename(right)));

  for (const dir of dirs) {
    const file = await entrypoint(dir);
    if (!file) continue;

    const mod = (await import(pathToFileURL(file).href)) as AuthExtensionModule;
    if (!mod.extension?.name) {
      throw new Error(`Auth-розширення ${path.basename(dir)} не експортує extension`);
    }
    registerAuthExtension(mod.extension);
  }

  loaded = true;
}
