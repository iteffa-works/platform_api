import path from 'node:path';
import { readDirSafe, subdirectories } from '../fs.js';
import { settings } from '../settings.js';
import { disabledPlugins } from './disabled.js';

/** Тека з теки плагінів — плагін (вмикається в адмінці); з теки розширень — розширення (завжди діє) */
export function isPluginDirectory(dir: string): boolean {
  return path.dirname(dir) === path.resolve(settings().pluginsDir);
}

/** Теки розширень, потім плагінів (кожні — за назвою), крім вимкнених у disabled.ts */
export async function pluginDirectories(): Promise<string[]> {
  const disabled = new Set(disabledPlugins);
  const { extensionsDir, pluginsDir } = settings();
  const dirs: string[] = [];
  for (const root of [extensionsDir, pluginsDir]) {
    for (const dir of await subdirectories(path.resolve(root))) {
      if (!disabled.has(path.basename(dir))) dirs.push(dir);
    }
  }
  return dirs;
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

/** Файли підтеки `subdir` усіх розширень і плагінів, відсортовані за іменем файлу */
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
