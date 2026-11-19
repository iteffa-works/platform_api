/**
 * Шина подій — сумісний інтерфейс над хуками-діями (`flowaxy/hooks`): `on` = addAction, `emit` = doAction.
 * Новий код — одразу `hooks.addAction` / `hooks.doAction` з типізованими іменами.
 */
import { hooks, type HookOptions } from '../hooks/index.js';

export type EventHandler = (payload?: unknown) => void | Promise<void>;

export function on(name: string, handler: EventHandler, options?: HookOptions): () => void {
  return hooks.addAction(name, handler, options);
}

export function emit(name: string, payload?: unknown): Promise<void> {
  return hooks.doAction(name, payload);
}
