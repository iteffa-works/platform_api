import { randomBytes } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { config } from '../../config/index.js';
import { HttpError } from '../../shared/http/index.js';
import type { User } from './models/user.js';

/**
 * Аватари: файли в DATA_DIR/avatars, імʼя `<userId>-<випадкове>.<ext>`.
 * Тип визначається за сигнатурою вмісту (не за заголовком); SVG не приймаємо — XSS.
 */

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

const TYPES = {
  png: 'image/png',
  jpg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
} as const;

type Extension = keyof typeof TYPES;

const dir = path.join(config.dataDir, 'avatars');

function detect(buffer: Buffer): Extension | null {
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpg';
  if (buffer.subarray(0, 6).toString('ascii').match(/^GIF8[79]a$/)) return 'gif';
  if (buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP') return 'webp';
  return null;
}

/** Шлях і MIME за імʼям файлу з URL; null — імʼя не нашого формату */
export function avatarPath(file: string): { path: string; type: string } | null {
  const match = /^\d+-[a-f0-9]{12}\.(png|jpg|gif|webp)$/.exec(file);
  return match ? { path: path.join(dir, file), type: TYPES[match[1] as Extension] } : null;
}

async function removeFile(file: string | null | undefined): Promise<void> {
  const target = file ? avatarPath(file) : null;
  if (target) await rm(target.path, { force: true });
}

/** Зберегти новий аватар (старий видаляється) */
export async function saveAvatar(user: User, data: unknown): Promise<string> {
  if (!Buffer.isBuffer(data) || data.length === 0) throw new HttpError(400, 'Файл зображення порожній');
  if (data.length > AVATAR_MAX_BYTES) throw new HttpError(413, 'Аватар: до 2 МБ');
  const ext = detect(data);
  if (!ext) throw new HttpError(400, 'Аватар: лише PNG, JPG, GIF або WebP');

  await mkdir(dir, { recursive: true });
  const file = `${user.id}-${randomBytes(6).toString('hex')}.${ext}`;
  await writeFile(path.join(dir, file), data);

  const previous = user.avatar;
  user.avatar = file;
  await user.save();
  await removeFile(previous);
  return file;
}

export async function removeAvatar(user: User): Promise<void> {
  const previous = user.avatar;
  user.avatar = null;
  await user.save();
  await removeFile(previous);
}

/** Прибрати файл після видалення акаунта */
export function removeAvatarFile(file: string | null | undefined): Promise<void> {
  return removeFile(file);
}
