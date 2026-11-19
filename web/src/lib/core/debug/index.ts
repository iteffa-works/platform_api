/**
 * Режим налагодження (як APP_DEBUG у Laravel): сторінка помилки з класом, повідомленням,
 * стеком і фрагментами коду. Типи спільні для API (`debug` у відповіді 500), SSR і браузера.
 */
export type DebugFrame = {
  fn: string;
  file: string;
  line: number;
  column: number;
  /** Код застосунку (не node_modules / node:) */
  app: boolean;
  /** Рядки навколо місця помилки: [номер, текст] */
  snippet?: Array<[number, string]>;
};

export type DebugInfo = {
  /** Де сталася помилка: API, серверний рендер web, браузер */
  origin: 'api' | 'web' | 'browser';
  exception: string;
  message: string;
  frames: DebugFrame[];
  request?: { method: string; url: string };
  route?: string | null;
  at: string;
};

/** V8 (`at fn (file:line:col)`) і Firefox / Safari (`fn@file:line:col`) */
const V8_FRAME = /^\s*at (?:(.+?) \()?(.+?):(\d+):(\d+)\)?$/;
const GECKO_FRAME = /^(.*?)@(.+?):(\d+):(\d+)$/;

export function parseFrames(stack: string | undefined): DebugFrame[] {
  const frames: DebugFrame[] = [];
  for (const raw of (stack ?? '').split('\n')) {
    const match = V8_FRAME.exec(raw) ?? GECKO_FRAME.exec(raw.trim());
    if (!match) continue;
    let file = match[2]!;
    if (file.startsWith('file:///')) file = decodeURIComponent(file.slice(8));
    const app = !/node_modules|^node:|^internal\/|\/@vite\/|\/\.svelte-kit\//.test(file);
    frames.push({ fn: match[1] || '(anonymous)', file, line: Number(match[3]), column: Number(match[4]), app });
  }
  return frames;
}

export function exceptionName(error: unknown): string {
  if (error instanceof Error) return error.constructor?.name || error.name || 'Error';
  return typeof error;
}

/** Шлях від кореня пакета (web/src/…, api/src/…) замість повного */
export function shortPath(file: string): string {
  const normalized = file.replace(/\\/g, '/');
  const match = /(?:^|\/)((?:api|web)\/(?:src|node_modules)\/.*)$/.exec(normalized) ?? /(node_modules\/.*)$/.exec(normalized);
  return match ? match[1]! : normalized.replace(/^https?:\/\/[^/]+\//, '');
}

/** Посилання «відкрити в редакторі» — лише для локальних файлів */
export function editorLink(frame: DebugFrame): string | null {
  const file = frame.file.replace(/\\/g, '/');
  if (!/^([a-zA-Z]:\/|\/)/.test(file) || file.startsWith('//')) return null;
  return `vscode://file/${file.replace(/^\//, '')}:${frame.line}:${frame.column}`;
}

/** Текст для копіювання (issue, чат) */
export function debugText(info: DebugInfo, status?: number): string {
  const head = [
    `${info.exception}: ${info.message}`,
    status ? `Status: ${status}` : '',
    info.request ? `${info.request.method} ${info.request.url}` : '',
    `Origin: ${info.origin} · ${info.at}`,
  ].filter(Boolean);
  const frames = info.frames.map((frame) => `    at ${frame.fn} (${shortPath(frame.file)}:${frame.line}:${frame.column})`);
  return [...head, '', ...frames].join('\n');
}
