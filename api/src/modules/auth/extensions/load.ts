import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { findEntrypoint, subdirectories } from '../../../shared/fs/index.js';
import { registerAuthExtension } from './registry.js';
import type { AuthExtensionModule } from './types.js';

const extensionsRoot = path.dirname(fileURLToPath(import.meta.url));

let loaded = false;

/** Автозавантаження підпапок auth/extensions (кожна — index.ts) */
export async function loadAuthExtensions(): Promise<void> {
  if (loaded) return;

  for (const dir of await subdirectories(extensionsRoot)) {
    const file = await findEntrypoint(dir);
    if (!file) continue;

    const mod = (await import(pathToFileURL(file).href)) as AuthExtensionModule;
    if (!mod.extension?.name) {
      throw new Error(`Auth-розширення ${path.basename(dir)} не експортує extension`);
    }
    registerAuthExtension(mod.extension);
  }

  loaded = true;
}
