import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { disabledPlugins } from './disabled.js';

const srcRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const roots = [path.join(srcRoot, 'modules'), path.join(srcRoot, 'plugins')];

export async function pluginDirectories(): Promise<string[]> {
  const disabled = new Set(disabledPlugins);
  const dirs: string[] = [];

  for (const root of roots) {
    let entries;
    try {
      entries = await readdir(root, { withFileTypes: true });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') continue;
      throw error;
    }

    for (const entry of entries) {
      if (!entry.isDirectory() || disabled.has(entry.name)) continue;
      dirs.push(path.join(root, entry.name));
    }
  }

  dirs.sort((left, right) => path.basename(left).localeCompare(path.basename(right)));
  return dirs;
}
