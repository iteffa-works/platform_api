import type { AuthExtension, AuthHookContext, AuthHookName } from './types.js';

const extensions = new Map<string, AuthExtension>();

/** Зареєструвати розширення auth (повторний виклик безпечний) */
export function registerAuthExtension(extension: AuthExtension): void {
  extensions.set(extension.name, extension);
}

/** Список увімкнених розширень */
export function listAuthExtensions(): AuthExtension[] {
  return [...extensions.values()].filter((item) => item.enabled !== false);
}

/** Запустити хук усіх увімкнених розширень по черзі */
export async function runAuthHooks(hook: AuthHookName, ctx: AuthHookContext): Promise<void> {
  for (const extension of listAuthExtensions()) {
    const handler = extension[hook];
    if (handler) await handler(ctx);
  }
}
