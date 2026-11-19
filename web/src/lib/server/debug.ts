/** Серверна частина налагодження: фрагменти коду з файлів (лише SSR, лише в режимі DEBUG) */
import { readFile } from 'node:fs/promises';
import type { RequestEvent } from '@sveltejs/kit';
import { exceptionName, parseFrames, type DebugFrame, type DebugInfo } from '$lib/core/debug';

const RADIUS = 7;
const MAX_SNIPPETS = 8;

async function snippet(frame: DebugFrame): Promise<DebugFrame['snippet']> {
  try {
    const lines = (await readFile(frame.file, 'utf8')).split(/\r?\n/);
    const from = Math.max(1, frame.line - RADIUS);
    const to = Math.min(lines.length, frame.line + RADIUS);
    const result: Array<[number, string]> = [];
    for (let number = from; number <= to; number++) result.push([number, lines[number - 1] ?? '']);
    return result;
  } catch {
    return undefined;
  }
}

export async function serverDebugInfo(error: unknown, event: RequestEvent): Promise<DebugInfo> {
  const frames = parseFrames(error instanceof Error ? error.stack : undefined);
  let left = MAX_SNIPPETS;
  for (const frame of frames) {
    if (!frame.app || left <= 0) continue;
    frame.snippet = await snippet(frame);
    if (frame.snippet) left--;
  }
  return {
    origin: 'web',
    exception: exceptionName(error),
    message: error instanceof Error ? error.message : String(error),
    frames,
    request: { method: event.request.method, url: event.url.pathname + event.url.search },
    route: event.route.id,
    at: new Date().toISOString(),
  };
}
