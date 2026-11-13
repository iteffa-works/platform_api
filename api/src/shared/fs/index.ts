import { access, readdir } from 'node:fs/promises';
import type { Dirent } from 'node:fs';
import path from 'node:path';

/** Вміст теки; відсутня тека = порожній список */
export async function readDirSafe(dir: string): Promise<Dirent[]> {
  try {
    return await readdir(dir, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
}

/** Підтеки (без прихованих), відсортовані за назвою */
export async function subdirectories(root: string): Promise<string[]> {
  return (await readDirSafe(root))
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right))
    .map((name) => path.join(root, name));
}

async function exists(file: string): Promise<boolean> {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

/** index.ts (dev) або index.js (dist) у теці */
export async function findEntrypoint(dir: string): Promise<string | undefined> {
  for (const name of ['index.ts', 'index.js']) {
    const file = path.join(dir, name);
    if (await exists(file)) return file;
  }
  return undefined;
}
