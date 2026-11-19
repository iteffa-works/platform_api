/**
 * Деталі помилки для режиму налагодження (APP_DEBUG): клас, повідомлення, стек із фрагментами коду.
 * Лише для розробки — у production APP_DEBUG вимкнено, назовні йде тільки текст помилки.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Request } from 'express';

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
  origin: 'api' | 'web' | 'browser';
  exception: string;
  message: string;
  frames: DebugFrame[];
  request?: { method: string; url: string };
  at: string;
};

const FRAME = /^\s*at (?:(.+?) \()?(.+?):(\d+):(\d+)\)?$/;
const SNIPPET_RADIUS = 7;
const SNIPPET_FRAMES = 8;

function readSnippet(file: string, line: number): Array<[number, string]> | undefined {
  try {
    const lines = readFileSync(file, 'utf8').split(/\r?\n/);
    const from = Math.max(1, line - SNIPPET_RADIUS);
    const to = Math.min(lines.length, line + SNIPPET_RADIUS);
    const result: Array<[number, string]> = [];
    for (let number = from; number <= to; number++) result.push([number, lines[number - 1] ?? '']);
    return result;
  } catch {
    return undefined;
  }
}

/** Розбір V8-стеку на кадри; фрагменти коду — для перших кадрів застосунку */
export function parseStack(stack: string | undefined): DebugFrame[] {
  const frames: DebugFrame[] = [];
  let snippets = 0;
  for (const raw of (stack ?? '').split('\n')) {
    const match = FRAME.exec(raw);
    if (!match) continue;
    let file = match[2]!;
    if (file.startsWith('file://')) file = fileURLToPath(file);
    const app = !file.includes('node_modules') && !file.startsWith('node:') && !file.startsWith('internal/');
    const frame: DebugFrame = { fn: match[1] ?? '(anonymous)', file, line: Number(match[3]), column: Number(match[4]), app };
    if (app && snippets < SNIPPET_FRAMES) {
      frame.snippet = readSnippet(file, frame.line);
      if (frame.snippet) snippets++;
    }
    frames.push(frame);
  }
  return frames;
}

export function debugInfo(err: unknown, req?: Request): DebugInfo {
  const error = err instanceof Error ? err : new Error(String(err));
  return {
    origin: 'api',
    exception: error.constructor?.name || error.name || 'Error',
    message: error.message,
    frames: parseStack(error.stack),
    request: req ? { method: req.method, url: req.originalUrl } : undefined,
    at: new Date().toISOString(),
  };
}
