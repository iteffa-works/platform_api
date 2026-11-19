import { createHash } from 'node:crypto';
import type { Request } from 'express';
import { track } from '../../../flowaxy/activity/index.js';
import { HttpError } from '../../../shared/http/index.js';
import { SshKey } from '../models/ssh-key.js';
import { DETAIL_FIELDS, type DetailField, UserDetails } from '../models/user-details.js';
import type { Session } from '../models/session.js';
import { listActiveSessions, listInactiveSessions } from '../sessions.js';

type Body = Record<string, unknown>;
const body = (value: unknown): Body => (value && typeof value === 'object' ? (value as Body) : {});
const FIELDS = Object.keys(DETAIL_FIELDS) as DetailField[];

/* ---------- Персональні дані ---------- */

function presentDetails(row: UserDetails | null) {
  return Object.fromEntries(FIELDS.map((field) => [field, row?.[field] ?? ''])) as Record<DetailField, string>;
}

export async function details(userId: number) {
  return { details: presentDetails(await UserDetails.findByPk(userId)) };
}

/** Перевірка полів: довжина, телефон, країна (ISO-2), податковий номер, індекс */
function readDetails(input: unknown): Partial<Record<DetailField, string | null>> {
  const data = body(input);
  const patch: Partial<Record<DetailField, string | null>> = {};
  for (const field of FIELDS) {
    if (data[field] === undefined) continue;
    const value = String(data[field] ?? '').trim().replace(/\s+/g, ' ');
    if (value.length > DETAIL_FIELDS[field]) throw new HttpError(400, `Поле «${field}»: до ${DETAIL_FIELDS[field]} символів`);
    patch[field] = value || null;
  }
  if (patch.phone && !/^\+?[\d\s()-]{7,20}$/.test(patch.phone)) throw new HttpError(400, 'Телефон: цифри у форматі +380 XX XXX XX XX');
  if (patch.country) {
    patch.country = patch.country.toUpperCase();
    if (!/^[A-Z]{2}$/.test(patch.country)) throw new HttpError(400, 'Невідома країна');
  }
  if (patch.taxId && !/^[A-Z]{0,2}\d{8,12}$/i.test(patch.taxId.replace(/\s/g, ''))) {
    throw new HttpError(400, 'Податковий номер: 8–12 цифр (ЄДРПОУ, ІПН або VAT)');
  }
  if (patch.postalCode && !/^[\dA-Z -]{3,10}$/i.test(patch.postalCode)) throw new HttpError(400, 'Невірний поштовий індекс');
  return patch;
}

export async function updateDetails(req: Request, userId: number, input: unknown) {
  const patch = readDetails(input);
  if (!Object.keys(patch).length) throw new HttpError(400, 'Немає змін');
  await UserDetails.upsert({ userId, ...patch });
  await track(req, userId, 'profile.details_updated');
  return details(userId);
}

/* ---------- Сесії: активні + історія ---------- */

function presentSession(session: Session, currentId: number) {
  const expired = session.expiresAt.getTime() <= Date.now();
  return {
    id: session.id,
    ip: session.ip,
    lastIp: session.lastIp ?? session.ip,
    userAgent: session.userAgent,
    twoFactor: session.twoFactor,
    createdAt: session.createdAt,
    lastSeenAt: session.lastSeenAt,
    expiresAt: session.expiresAt,
    endedAt: session.revokedAt ?? (expired ? session.expiresAt : null),
    current: session.id === currentId,
  };
}

export async function sessionList(userId: number, currentId: number) {
  const [active, inactive] = await Promise.all([listActiveSessions(userId), listInactiveSessions(userId)]);
  return {
    sessions: active.map((row) => presentSession(row, currentId)),
    history: inactive.map((row) => presentSession(row, currentId)),
  };
}

/* ---------- SSH-ключі ---------- */

const KEY_TYPES = [
  'ssh-ed25519',
  'ssh-rsa',
  'ecdsa-sha2-nistp256',
  'ecdsa-sha2-nistp384',
  'ecdsa-sha2-nistp521',
  'sk-ssh-ed25519@openssh.com',
  'sk-ecdsa-sha2-nistp256@openssh.com',
];
const MAX_KEYS = 20;

/** Розбір рядка `тип base64 [коментар]`; тип усередині ключа має збігатися із заявленим */
export function parsePublicKey(raw: unknown) {
  const text = String(raw ?? '').trim().replace(/\s+/g, ' ');
  const [type, encoded, ...comment] = text.split(' ');
  if (!type || !encoded || !KEY_TYPES.includes(type) || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) {
    throw new HttpError(400, 'Невірний формат ключа. Вставте вміст файлу .pub (ssh-ed25519 AAAA… коментар)');
  }
  const blob = Buffer.from(encoded, 'base64');
  const length = blob.length >= 4 ? blob.readUInt32BE(0) : 0;
  if (length !== type.length || blob.subarray(4, 4 + length).toString() !== type || blob.length < 4 + length + 16) {
    throw new HttpError(400, 'Ключ пошкоджено: тип не збігається із вмістом');
  }
  if (type === 'ssh-rsa' && blob.length < 270) throw new HttpError(400, 'RSA-ключ закороткий: потрібно щонайменше 2048 біт');
  const fingerprint = `SHA256:${createHash('sha256').update(blob).digest('base64').replace(/=+$/, '')}`;
  return { type, publicKey: `${type} ${encoded}`, comment: comment.join(' '), fingerprint };
}

const presentKey = (key: SshKey) => ({
  id: key.id,
  title: key.title,
  type: key.type,
  fingerprint: key.fingerprint,
  createdAt: key.createdAt,
});

export async function sshKeys(userId: number) {
  const keys = await SshKey.findAll({ where: { userId }, order: [['id', 'ASC']] });
  return { keys: keys.map(presentKey) };
}

export async function addSshKey(req: Request, userId: number, input: unknown) {
  const data = body(input);
  const key = parsePublicKey(data.publicKey);
  const title = (String(data.title ?? '').trim() || key.comment || key.type).slice(0, 64);
  if (await SshKey.count({ where: { userId } }) >= MAX_KEYS) throw new HttpError(400, `Не більше ${MAX_KEYS} ключів`);
  if (await SshKey.findOne({ where: { userId, fingerprint: key.fingerprint } })) throw new HttpError(409, 'Цей ключ уже додано');
  const row = await SshKey.create({ userId, title, type: key.type, publicKey: key.publicKey, fingerprint: key.fingerprint });
  await track(req, userId, 'ssh.added', { title });
  return { key: presentKey(row) };
}

export async function removeSshKey(req: Request, userId: number, id: number) {
  const key = await SshKey.findOne({ where: { id, userId } });
  if (!key) throw new HttpError(404, 'Ключ не знайдено');
  await key.destroy();
  await track(req, userId, 'ssh.removed', { title: key.title });
}
