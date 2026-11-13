import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { subdirectories } from '../../shared/fs/index.js';
import { disabledPlugins } from './disabled.js';

const srcRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const roots = [path.join(srcRoot, 'modules'), path.join(srcRoot, 'plugins')];

/** Теки плагінів з modules/ і plugins/ (крім вимкнених) */
export async function pluginDirectories(): Promise<string[]> {
  const disabled = new Set(disabledPlugins);
  const dirs: string[] = [];

  for (const root of roots) {
    for (const dir of await subdirectories(root)) {
      if (!disabled.has(path.basename(dir))) dirs.push(dir);
    }
  }

  return dirs.sort((left, right) => path.basename(left).localeCompare(path.basename(right)));
}
