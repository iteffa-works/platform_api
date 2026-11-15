import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readDirSafe, subdirectories } from '../../shared/fs/index.js';
import { disabledPlugins } from './disabled.js';

const srcRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const coreRoot = path.join(srcRoot, 'modules');
const addonsRoot = path.join(srcRoot, 'plugins');
const roots = [coreRoot, addonsRoot];

/** Тека з plugins/ — addon (вмикається в адмінці), з modules/ — ядро */
export function isAddonDirectory(dir: string): boolean {
  return path.dirname(dir) === addonsRoot;
}

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

/** Чернетки міграцій (`*.draft.ts`) — лише з MIGRATIONS_DRAFTS=1 (тестова БД під час розробки) */
const includeDrafts = process.env.MIGRATIONS_DRAFTS === '1';

function isSourceFile(name: string, names: ReadonlySet<string>): boolean {
  if (name.startsWith('.') || name.endsWith('.d.ts') || /\.(test|spec)\.[jt]s$/.test(name)) return false;
  if (!includeDrafts && /\.draft\.[jt]s$/.test(name)) return false;
  if (name.endsWith('.ts')) return true;
  // dist: лише .js без .ts-двійника
  return name.endsWith('.js') && !names.has(name.replace(/\.js$/, '.ts'));
}

/** Файли підтеки `subdir` усіх плагінів, відсортовані за іменем файлу */
export async function pluginFiles(subdir: string): Promise<string[]> {
  const files: string[] = [];

  for (const dir of await pluginDirectories()) {
    const entries = (await readDirSafe(path.join(dir, subdir))).map((entry) => entry.name);
    const names = new Set(entries);
    for (const name of entries) {
      if (isSourceFile(name, names)) files.push(path.join(dir, subdir, name));
    }
  }

  return files.sort((left, right) => path.basename(left).localeCompare(path.basename(right)));
}
