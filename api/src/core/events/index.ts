export type EventHandler = (payload?: unknown) => void | Promise<void>;

const listeners = new Map<string, Set<EventHandler>>();

export function on(name: string, handler: EventHandler): void {
  const current = listeners.get(name) ?? new Set<EventHandler>();
  current.add(handler);
  listeners.set(name, current);
}

export async function emit(name: string, payload?: unknown): Promise<void> {
  for (const handler of listeners.get(name) ?? []) {
    try {
      await handler(payload);
    } catch (error) {
      console.error(`[events] ${name}`, error);
    }
  }
}
