/** Контекст сторінки за схемою: дії, перерендер, стан помилки й відкритого діалогу — для будь-якого вузла дерева */
import { getContext, setContext } from 'svelte';
import type { Readable, Writable } from 'svelte/store';
import type { Values } from './actions.js';
import type { UiAction } from './schema.js';

export type RemoteContext = {
  run: (action: UiAction, values?: Values) => Promise<void>;
  /** Перерендер з поточними значеннями живої форми */
  refresh: (values: Values) => void;
  busy: Readable<boolean>;
  /** Помилка останньої дії (показується й у відкритому діалозі) */
  error: Readable<string>;
  /** Відкритий діалог (за заголовком) — переживає перерендер живої форми */
  dialog: Writable<string | null>;
};

const KEY = Symbol('remote-page');

export const provideRemote = (context: RemoteContext) => setContext(KEY, context);
export const useRemote = () => getContext<RemoteContext>(KEY);
