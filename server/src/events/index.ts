export type EventHandler = (payload?: unknown) => void | Promise<void>;

const listeners = new Map<string, Set<EventHandler>>();

export function on(name: string, handler: EventHandler): void {
  const current = listeners.get(name) ?? new Set<EventHandler>();
  current.add(handler);
  listeners.set(name, current);
}

export function off(name: string, handler: EventHandler): void {
  listeners.get(name)?.delete(handler);
}

export async function emit(name: string, payload?: unknown): Promise<void> {
  const current = listeners.get(name);
  if (!current) return;

  for (const handler of current) {
    try {
      await handler(payload);
    } catch (error) {
      console.error(`[events] ${name}`, error);
    }
  }
}
