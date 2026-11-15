import type { Request } from 'express';
import { track } from '../../core/activity/index.js';
import { User } from '../../modules/auth/models/user.js';
import { decrypt, encrypt, randomToken } from '../../shared/crypto/index.js';
import { HttpError } from '../../shared/http/index.js';
import { field, forgetSession, IspClient, IspError, type IspElem } from './client.js';
import { IspAccount, IspServer } from './models.js';
import { normalizeUrl } from './url.js';

const PANEL_USER = /^[a-z][a-z0-9_-]{2,31}$/;

/* ---------- Допоміжне ---------- */

/** Помилка панелі / мережі → 502 з текстом панелі */
async function panel<T>(action: () => Promise<T>): Promise<T> {
  try {
    return await action();
  } catch (error) {
    if (error instanceof IspError) throw new HttpError(502, `ISPmanager: ${error.message}`);
    throw error;
  }
}

function clientFor(server: IspServer): IspClient {
  return new IspClient({
    url: server.url,
    username: server.username,
    password: decrypt(server.passwordEnc),
    verifyTls: server.verifyTls,
  });
}

function readPanelUser(input: unknown): string {
  const name = String(input ?? '').trim().toLowerCase();
  if (!PANEL_USER.test(name)) throw new HttpError(400, 'Логін панелі: 3–32 символи, латиниця, цифри, _ і -, з літери');
  return name;
}

function readPassword(input: unknown): string {
  const password = String(input ?? '');
  if (password.length < 8 || password.length > 64) throw new HttpError(400, 'Пароль панелі: 8–64 символи');
  return password;
}

function readPreset(input: unknown): string | null {
  const preset = String(input ?? '').trim();
  if (preset.length > 64) throw new HttpError(400, 'Шаблон: до 64 символів');
  return preset || null;
}

function presentServer(server: IspServer, accounts = 0) {
  return {
    id: server.id,
    name: server.name,
    url: server.url,
    username: server.username,
    verifyTls: server.verifyTls,
    isActive: server.isActive,
    defaultPreset: server.defaultPreset,
    accounts,
  };
}

function presentAccount(account: IspAccount) {
  return {
    id: account.id,
    panelUser: account.panelUser,
    preset: account.preset,
    status: account.status,
    createdAt: account.createdAt,
    server: account.server ? { id: account.server.id, name: account.server.name, url: account.server.url } : null,
    ...(account.user ? { user: { id: account.user.id, email: account.user.email } } : {}),
  };
}

/** Користувач панелі заблокований? (`active=off` або `blocked=on`) */
function isSuspended(elem: IspElem): boolean {
  return field(elem, 'active') === 'off' || field(elem, 'blocked') === 'on';
}

async function findServer(id: number): Promise<IspServer> {
  const server = await IspServer.findByPk(id);
  if (!server) throw new HttpError(404, 'Сервер не знайдено');
  return server;
}

async function findAccount(id: number, userId?: number): Promise<IspAccount> {
  const account = await IspAccount.findOne({
    where: userId === undefined ? { id } : { id, userId },
    include: [{ model: IspServer, as: 'server' }],
  });
  if (!account?.server) throw new HttpError(404, 'Хостинг-акаунт не знайдено');
  return account;
}

/* ---------- Сервери ---------- */

type ServerInput = Partial<Pick<IspServer, 'name' | 'url' | 'username' | 'verifyTls' | 'isActive' | 'defaultPreset'>> & {
  password?: string;
};

function readServer(input: Record<string, unknown>, partial: boolean): ServerInput {
  const data: ServerInput = {};
  if (!partial || input.name !== undefined) {
    const name = String(input.name ?? '').trim();
    if (!name || name.length > 80) throw new HttpError(400, 'Назва сервера: 1–80 символів');
    data.name = name;
  }
  if (!partial || input.url !== undefined) data.url = normalizeUrl(input.url);
  if (!partial || input.username !== undefined) {
    const username = String(input.username ?? '').trim();
    if (!username || username.length > 64) throw new HttpError(400, 'Логін адміністратора панелі: 1–64 символи');
    data.username = username;
  }
  // Пароль при оновленні — лише якщо передано непорожній
  if (!partial || (input.password !== undefined && input.password !== '')) {
    const password = String(input.password ?? '');
    if (!password || password.length > 128) throw new HttpError(400, 'Пароль адміністратора панелі: 1–128 символів');
    data.password = password;
  }
  if (input.verifyTls !== undefined) data.verifyTls = Boolean(input.verifyTls);
  if (input.isActive !== undefined) data.isActive = Boolean(input.isActive);
  if (input.defaultPreset !== undefined) data.defaultPreset = readPreset(input.defaultPreset);
  return data;
}

export async function listServers() {
  const [servers, counts] = await Promise.all([
    IspServer.findAll({ order: [['name', 'ASC']] }),
    IspAccount.count({ group: ['serverId'] }) as unknown as Promise<Array<{ serverId: number; count: number }>>,
  ]);
  const byServer = new Map(counts.map((row) => [row.serverId, Number(row.count)]));
  return { servers: servers.map((server) => presentServer(server, byServer.get(server.id) ?? 0)) };
}

export async function createServer(input: Record<string, unknown>) {
  const { password, ...data } = readServer(input, false);
  const server = await IspServer.create({
    ...(data as Required<Pick<ServerInput, 'name' | 'url' | 'username'>>),
    verifyTls: data.verifyTls ?? true,
    isActive: data.isActive ?? true,
    defaultPreset: data.defaultPreset ?? null,
    passwordEnc: encrypt(password!),
  });
  return { server: presentServer(server) };
}

export async function updateServer(id: number, input: Record<string, unknown>) {
  const server = await findServer(id);
  const { password, ...data } = readServer(input, true);
  forgetSession(server.url, server.username);
  await server.update({ ...data, ...(password ? { passwordEnc: encrypt(password) } : {}) });
  return { server: presentServer(server, await IspAccount.count({ where: { serverId: id } })) };
}

export async function deleteServer(id: number) {
  const server = await findServer(id);
  if (await IspAccount.count({ where: { serverId: id } })) {
    throw new HttpError(400, 'На сервері є акаунти — видаліть їх або вимкніть сервер');
  }
  forgetSession(server.url, server.username);
  await server.destroy();
}

/** Перевірка зʼєднання: вхід + кількість користувачів і шаблонів */
export async function checkServer(id: number) {
  const server = await findServer(id);
  const client = clientFor(server);
  try {
    const [users, presets] = await Promise.all([client.users(), client.presets()]);
    return { ok: true, users: users.length, presets: presets.length };
  } catch (error) {
    if (error instanceof IspError) return { ok: false, error: error.message };
    throw error;
  }
}

export async function serverPresets(id: number) {
  const server = await findServer(id);
  const presets = await panel(() => clientFor(server).presets());
  return { presets: presets.map((elem) => field(elem, 'name')).filter(Boolean) };
}

/** Користувачі панелі + чи привʼязані до платформи */
export async function serverUsers(id: number) {
  const server = await findServer(id);
  const [elems, linked] = await Promise.all([
    panel(() => clientFor(server).users()),
    IspAccount.findAll({ where: { serverId: id }, attributes: ['panelUser'] }),
  ]);
  const taken = new Set(linked.map((account) => account.panelUser));
  return {
    users: elems.map((elem) => {
      const name = field(elem, 'name');
      return {
        name,
        fullname: field(elem, 'fullname') || null,
        preset: field(elem, 'preset') || null,
        suspended: isSuspended(elem),
        linked: taken.has(name),
      };
    }),
  };
}

/* ---------- Акаунти (адмінка) ---------- */

export async function listAccounts() {
  const accounts = await IspAccount.findAll({
    order: [['id', 'DESC']],
    include: [
      { model: IspServer, as: 'server' },
      { model: User, as: 'user', attributes: ['id', 'email'] },
    ],
  });
  return { accounts: accounts.map(presentAccount) };
}

/**
 * Новий хостинг-акаунт: `create` — створити користувача в панелі, `link` — привʼязати наявного.
 * Згенерований пароль повертається один раз і не зберігається.
 */
export async function createAccount(req: Request, actorId: number, input: Record<string, unknown>) {
  const mode = input.mode === 'link' ? 'link' : 'create';
  const server = await findServer(Number(input.serverId));
  if (!server.isActive) throw new HttpError(400, 'Сервер вимкнено');

  const email = String(input.email ?? '').trim().toLowerCase();
  const user = await User.findOne({ where: { email }, attributes: ['id', 'email'] });
  if (!user) throw new HttpError(404, 'Користувача не знайдено');

  const panelUser = readPanelUser(input.panelUser);
  if (await IspAccount.findOne({ where: { serverId: server.id, panelUser } })) {
    throw new HttpError(409, 'Цей користувач панелі вже привʼязаний');
  }

  const client = clientFor(server);
  let preset = readPreset(input.preset) ?? server.defaultPreset;
  let status: 'active' | 'suspended' = 'active';
  let generated: string | null = null;

  if (mode === 'create') {
    const password = input.password ? readPassword(input.password) : (generated = randomToken(12));
    await panel(() => client.createUser({ name: panelUser, password, preset: preset ?? undefined, fullname: user.email }));
  } else {
    const found = (await panel(() => client.users())).find((elem) => field(elem, 'name') === panelUser);
    if (!found) throw new HttpError(404, 'Користувача з таким логіном у панелі немає');
    preset = field(found, 'preset') || preset;
    status = isSuspended(found) ? 'suspended' : 'active';
  }

  const account = await IspAccount.create({ serverId: server.id, userId: user.id, panelUser, preset, status });
  await track(null, user.id, 'hosting.created', { login: panelUser, server: server.name });
  await track(req, actorId, 'admin.hosting_created', { userId: user.id, login: panelUser });

  return { account: presentAccount(await findAccount(account.id)), password: generated };
}

export async function setAccountStatus(req: Request, actorId: number, id: number, status: 'active' | 'suspended') {
  const account = await findAccount(id);
  const client = clientFor(account.server!);
  await panel(() => (status === 'suspended' ? client.suspendUser(account.panelUser) : client.resumeUser(account.panelUser)));
  await account.update({ status });
  const action = status === 'suspended' ? 'suspended' : 'resumed';
  await track(null, account.userId, `hosting.${action}`, { login: account.panelUser });
  await track(req, actorId, `admin.hosting_${action}`, { userId: account.userId, login: account.panelUser });
  return { account: presentAccount(account) };
}

/** Видалити привʼязку; `removeFromPanel` — також користувача в панелі (з усіма сайтами) */
export async function deleteAccount(req: Request, actorId: number, id: number, removeFromPanel: boolean) {
  const account = await findAccount(id);
  if (removeFromPanel) await panel(() => clientFor(account.server!).deleteUser(account.panelUser));
  await account.destroy();
  await track(null, account.userId, 'hosting.deleted', { login: account.panelUser });
  await track(req, actorId, 'admin.hosting_deleted', { userId: account.userId, login: account.panelUser, panel: removeFromPanel ? 'yes' : 'no' });
}

/* ---------- Кабінет ---------- */

export async function myAccounts(userId: number) {
  const accounts = await IspAccount.findAll({
    where: { userId },
    order: [['id', 'ASC']],
    include: [{ model: IspServer, as: 'server' }],
  });
  return { accounts: accounts.map(presentAccount) };
}

async function usableAccount(userId: number, id: number): Promise<IspAccount> {
  const account = await findAccount(id, userId);
  if (account.status === 'suspended') throw new HttpError(403, 'Хостинг-акаунт заблоковано');
  if (!account.server!.isActive) throw new HttpError(503, 'Сервер тимчасово недоступний');
  return account;
}

export async function mySites(userId: number, id: number) {
  const account = await usableAccount(userId, id);
  const elems = await panel(() => clientFor(account.server!).webdomains(account.panelUser));
  return {
    sites: elems.map((elem) => ({
      name: field(elem, 'name'),
      docroot: field(elem, 'docroot') || null,
      ssl: field(elem, 'secure') === 'on' || field(elem, 'ssl') === 'on',
      active: field(elem, 'active') !== 'off',
    })),
  };
}

export async function panelLogin(req: Request, userId: number, id: number) {
  const account = await usableAccount(userId, id);
  const url = await panel(() => clientFor(account.server!).loginUrl(account.panelUser));
  await track(req, userId, 'hosting.panel_login', { login: account.panelUser });
  return { url };
}

export async function changePassword(req: Request, userId: number, id: number, input: unknown) {
  const account = await usableAccount(userId, id);
  const password = readPassword(input);
  await panel(() => clientFor(account.server!).setPassword(account.panelUser, password));
  await track(req, userId, 'hosting.password_changed', { login: account.panelUser });
}
