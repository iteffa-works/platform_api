/**
 * Транспорт API ISPmanager 6 (COREmanager): `POST <url>/ispmgr`, form-urlencoded, `out=json`.
 * Сесія адміністратора (`func=auth` → `auth=<id>`) кешується в памʼяті й поновлюється, коли панель
 * відповідає `auth` / `access` (прострочена сесія). Паролі — лише в тілі POST, не в URL.
 */
import http from 'node:http';
import https from 'node:https';
import { PanelError, type PanelConnection } from '../contracts.js';

/** Рядок списку (`elem`) після нормалізації */
export type IspElem = Record<string, unknown>;
export type IspDoc = Record<string, unknown>;

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

/** Рядкове значення поля ('' — немає) */
export function field(elem: IspElem, key: string): string {
  const value = elem[key];
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (value && typeof value === 'object' && '$' in value) return String((value as { $: unknown }).$);
  return '';
}

/** Службове значення поля (`$orig`), інакше текст */
export function original(elem: IspElem, key: string): string {
  const value = elem[key];
  if (value && typeof value === 'object' && 'orig' in value) return String((value as { orig: unknown }).orig);
  return field(elem, key);
}

/** Перший варіант списку форми (`slist`), напр. IP-адреса для `ipsrc` */
export function firstOption(doc: IspDoc, name: string): string | null {
  const list = toArray<Record<string, unknown>>(doc.slist).find((item) => item.name === name);
  const first = toArray<Record<string, unknown>>(list?.val)[0];
  return first ? String(first.key ?? first.$ ?? '') || null : null;
}

function errorMessage(error: Record<string, unknown>): string {
  const msg = error.msg;
  if (typeof msg === 'string' && msg) return msg.trim();
  if (msg && typeof msg === 'object' && typeof (msg as { $?: unknown }).$ === 'string') return (msg as { $: string }).$.trim();
  return [error.type, error.object].filter(Boolean).join(': ') || 'Помилка панелі';
}

/** Нормалізований `doc` або PanelError з помилкою панелі */
export function parseResponse(text: string): IspDoc {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new PanelError('Панель повернула не JSON — перевірте адресу', 'protocol');
  }
  const root = (parsed as { doc?: unknown })?.doc ?? parsed;
  const doc = (normalize(root) ?? {}) as IspDoc;
  const error = doc.error;
  if (error && typeof error === 'object') {
    throw new PanelError(errorMessage(error as Record<string, unknown>), String((error as { type?: unknown }).type ?? 'error'));
  }
  return doc;
}

function post(connection: PanelConnection, params: URLSearchParams): Promise<string> {
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
          reject(new PanelError('Завелика відповідь панелі', 'protocol'));
          return;
        }
        chunks.push(chunk);
      });
      res.on('end', () => {
        const status = res.statusCode ?? 0;
        if (status >= 400) reject(new PanelError(`Панель відповіла HTTP ${status}`, 'http'));
        else resolve(Buffer.concat(chunks).toString('utf8'));
      });
      res.on('error', reject);
    };

    // Редиректи не виконуються: відповідь 3xx — не JSON → помилка протоколу
    const req = target.protocol === 'https:'
      ? https.request(target, { ...options, rejectUnauthorized: connection.verifyTls }, onResponse)
      : http.request(target, options, onResponse);

    req.on('timeout', () => req.destroy(new PanelError('Панель не відповіла вчасно', 'timeout')));
    req.on('error', (error) => {
      reject(error instanceof PanelError ? error : new PanelError(`Панель недоступна: ${error.message}`, 'network'));
    });
    req.end(body);
  });
}

/** Сесії адміністратора: `url|login` → id сесії */
const sessions = new Map<string, string>();

export function forgetSession(url: string, username: string): void {
  sessions.delete(`${url}|${username}`);
}

export class IspTransport {
  constructor(private readonly connection: PanelConnection) {}

  get url(): string {
    return this.connection.url;
  }

  private get sessionKey(): string {
    return `${this.connection.url}|${this.connection.username}`;
  }

  private async request(params: Record<string, string>): Promise<IspDoc> {
    const text = await post(this.connection, new URLSearchParams({ out: 'json', lang: 'en', ...params }));
    return parseResponse(text);
  }

  private async login(): Promise<string> {
    const doc = await this.request({ func: 'auth', username: this.connection.username, password: this.connection.password });
    const auth = doc.auth;
    const id = typeof auth === 'string'
      ? auth
      : auth && typeof auth === 'object'
        ? String((auth as Record<string, unknown>).id ?? (auth as Record<string, unknown>).$ ?? '')
        : '';
    if (!id) throw new PanelError('Не вдалося увійти в панель', 'auth');
    sessions.set(this.sessionKey, id);
    return id;
  }

  /**
   * Виклик функції від імені адміністратора; `su` — від імені користувача панелі.
   * Прострочена сесія — `auth` / `access` → один повторний вхід.
   */
  async call(func: string, params: Record<string, string> = {}, retry = true): Promise<IspDoc> {
    const cached = sessions.get(this.sessionKey);
    const auth = cached ?? (await this.login());
    try {
      return await this.request({ ...params, func, auth });
    } catch (error) {
      if (retry && cached && error instanceof PanelError && (error.code === 'auth' || error.code === 'access')) {
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

  /** Збереження форми (`sok=ok`) — створення / зміна обʼєкта */
  async save(func: string, params: Record<string, string>): Promise<IspDoc> {
    return this.call(func, { ...params, sok: 'ok' });
  }
}
