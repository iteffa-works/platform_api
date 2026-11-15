/**
 * Клієнт API ISPmanager 6 (COREmanager): `POST <url>/ispmgr`, form-urlencoded, `out=json`.
 * Сесія адміністратора (`func=auth` → `auth=<id>`) кешується в памʼяті й поновлюється при помилці `auth`.
 */
import { randomBytes } from 'node:crypto';
import http from 'node:http';
import https from 'node:https';

export type IspConnection = {
  /** Адреса панелі без `/ispmgr`, напр. `https://host.example.com:1500` */
  url: string;
  username: string;
  password: string;
  verifyTls: boolean;
};

/** Рядок списку (`elem`) після нормалізації */
export type IspElem = Record<string, unknown>;

export class IspError extends Error {
  constructor(message: string, readonly type: string) {
    super(message);
  }
}

const TIMEOUT_MS = 20_000;
const MAX_RESPONSE_BYTES = 10 * 1024 * 1024;

/** `{"$": "v"}` → `"v"`, атрибути `"$name"` → `name`; решта — рекурсивно */
export function normalize(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(normalize);
  if (!node || typeof node !== 'object') return node;

  const entries = Object.entries(node as Record<string, unknown>);
  if (entries.length === 1 && entries[0]![0] === '$') return entries[0]![1];

  const result: Record<string, unknown> = {};
  for (const [key, value] of entries) {
    result[key.length > 1 && key.startsWith('$') ? key.slice(1) : key] = normalize(value);
  }
  return result;
}

/** Один елемент панель віддає обʼєктом, кілька — масивом, жодного — без поля */
export function toArray<T>(value: unknown): T[] {
  if (value === undefined || value === null) return [];
  return (Array.isArray(value) ? value : [value]) as T[];
}

/** Рядкове значення поля елемента ('' — немає) */
export function field(elem: IspElem, key: string): string {
  const value = elem[key];
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (value && typeof value === 'object' && '$' in value) return String((value as { $: unknown }).$);
  return '';
}

function errorMessage(error: Record<string, unknown>): string {
  const msg = error.msg;
  if (typeof msg === 'string' && msg) return msg;
  if (msg && typeof msg === 'object' && typeof (msg as { $?: unknown }).$ === 'string') return (msg as { $: string }).$;
  return [error.type, error.object].filter(Boolean).join(': ') || 'Помилка панелі';
}

/** Нормалізований `doc` або IspError з помилкою панелі */
export function parseResponse(text: string): Record<string, unknown> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new IspError('Панель повернула не JSON — перевірте адресу', 'protocol');
  }
  const root = (parsed as { doc?: unknown })?.doc ?? parsed;
  const doc = (normalize(root) ?? {}) as Record<string, unknown>;
  const error = doc.error;
  if (error && typeof error === 'object') {
    throw new IspError(errorMessage(error as Record<string, unknown>), String((error as { type?: unknown }).type ?? 'error'));
  }
  return doc;
}

function post(connection: IspConnection, params: URLSearchParams): Promise<string> {
  const target = new URL(`${connection.url}/ispmgr`);
  const body = params.toString();
  const options: https.RequestOptions = {
    method: 'POST',
    timeout: TIMEOUT_MS,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(body),
      Accept: 'application/json',
    },
  };

  return new Promise((resolve, reject) => {
    const onResponse = (res: http.IncomingMessage) => {
      const chunks: Buffer[] = [];
      let size = 0;
      res.on('data', (chunk: Buffer) => {
        size += chunk.length;
        if (size > MAX_RESPONSE_BYTES) {
          res.destroy();
          reject(new IspError('Завелика відповідь панелі', 'protocol'));
          return;
        }
        chunks.push(chunk);
      });
      res.on('end', () => {
        const status = res.statusCode ?? 0;
        if (status >= 400) reject(new IspError(`Панель відповіла HTTP ${status}`, 'http'));
        else resolve(Buffer.concat(chunks).toString('utf8'));
      });
      res.on('error', reject);
    };

    const req = target.protocol === 'https:'
      ? https.request(target, { ...options, rejectUnauthorized: connection.verifyTls }, onResponse)
      : http.request(target, options, onResponse);

    req.on('timeout', () => req.destroy(new IspError('Панель не відповіла вчасно', 'timeout')));
    req.on('error', (error) => {
      reject(error instanceof IspError ? error : new IspError(`Панель недоступна: ${error.message}`, 'network'));
    });
    req.end(body);
  });
}

/** Сесії адміністратора: `url|login` → id сесії */
const sessions = new Map<string, string>();

export function forgetSession(url: string, username: string): void {
  sessions.delete(`${url}|${username}`);
}

export class IspClient {
  constructor(private readonly connection: IspConnection) {}

  private get sessionKey(): string {
    return `${this.connection.url}|${this.connection.username}`;
  }

  private async request(params: Record<string, string>): Promise<Record<string, unknown>> {
    const text = await post(this.connection, new URLSearchParams({ out: 'json', lang: 'en', ...params }));
    return parseResponse(text);
  }

  private async login(): Promise<string> {
    const doc = await this.request({
      func: 'auth',
      username: this.connection.username,
      password: this.connection.password,
    });
    const auth = doc.auth;
    const id = typeof auth === 'string'
      ? auth
      : auth && typeof auth === 'object'
        ? String((auth as Record<string, unknown>).id ?? (auth as Record<string, unknown>).$ ?? '')
        : '';
    if (!id) throw new IspError('Не вдалося увійти в панель', 'auth');
    sessions.set(this.sessionKey, id);
    return id;
  }

  /** Виклик функції панелі від імені адміністратора (`su` — від імені користувача) */
  async call(func: string, params: Record<string, string> = {}, retry = true): Promise<Record<string, unknown>> {
    const auth = sessions.get(this.sessionKey) ?? (await this.login());
    try {
      return await this.request({ ...params, func, auth });
    } catch (error) {
      if (retry && error instanceof IspError && error.type === 'auth') {
        sessions.delete(this.sessionKey);
        return this.call(func, params, false);
      }
      throw error;
    }
  }

  /** Список (`elem`) */
  async list(func: string, params: Record<string, string> = {}): Promise<IspElem[]> {
    return toArray<IspElem>((await this.call(func, params)).elem);
  }

  /* ---------- Операції ---------- */

  presets(): Promise<IspElem[]> {
    return this.list('preset');
  }

  users(): Promise<IspElem[]> {
    return this.list('user');
  }

  async createUser(input: { name: string; password: string; preset?: string; fullname?: string }): Promise<void> {
    await this.call('user.edit', {
      sok: 'ok',
      name: input.name,
      passwd: input.password,
      confirm: input.password,
      ...(input.preset ? { preset: input.preset } : {}),
      ...(input.fullname ? { fullname: input.fullname } : {}),
    });
  }

  async setPassword(name: string, password: string): Promise<void> {
    await this.call('user.edit', { sok: 'ok', elid: name, passwd: password, confirm: password });
  }

  async suspendUser(name: string): Promise<void> {
    await this.call('user.suspend', { elid: name });
  }

  async resumeUser(name: string): Promise<void> {
    await this.call('user.resume', { elid: name });
  }

  async deleteUser(name: string): Promise<void> {
    await this.call('user.delete', { elid: name, sok: 'ok' });
  }

  /** Сайти користувача панелі */
  webdomains(name: string): Promise<IspElem[]> {
    return this.list('webdomain', { su: name });
  }

  /** Одноразове посилання входу в панель без пароля */
  async loginUrl(name: string): Promise<string> {
    const key = randomBytes(16).toString('hex');
    await this.call('session.newkey', { username: name, key, sok: 'ok' });
    const query = new URLSearchParams({ func: 'auth', username: name, key, checkcookie: 'no' });
    return `${this.connection.url}/ispmgr?${query}`;
  }
}
