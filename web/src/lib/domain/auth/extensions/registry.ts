import type { AuthMode } from '../config.js';
import type { AuthClientExtension, AuthExtensionSlot } from './types.js';

const extensions = new Map<string, AuthClientExtension>();

export function registerAuthExtension(extension: AuthClientExtension): void {
  extensions.set(extension.name, extension);
}

function activeExtensions(mode?: AuthMode): AuthClientExtension[] {
  return [...extensions.values()].filter(
    (item) => item.enabled !== false && (!mode || !item.modes || item.modes.includes(mode)),
  );
}

export function listAuthExtensionSlots(mode: AuthMode): AuthExtensionSlot[] {
  return activeExtensions()
    .flatMap((item) => item.slots?.() ?? [])
    .filter((slot) => !slot.modes || slot.modes.includes(mode))
    .sort((a, b) => (a.order ?? 100) - (b.order ?? 100));
}

export function collectAuthExtensionFields(mode: AuthMode): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const extension of activeExtensions(mode)) {
    for (const field of extension.fields?.() ?? []) {
      payload[field.key] = field.getValue();
    }
  }
  return payload;
}

export function validateAuthExtensions(mode: AuthMode): string | undefined {
  for (const extension of activeExtensions(mode)) {
    const message = extension.validate?.();
    if (message) return message;
  }
  return undefined;
}

/** Перше непорожнє значення від розширень */
function resolve(pick: (extension: AuthClientExtension) => string | undefined, fallback: string): string {
  for (const extension of activeExtensions()) {
    const value = pick(extension);
    if (value) return value;
  }
  return fallback;
}

export function resolveAuthSubmitLabel(mode: AuthMode, fallback: string): string {
  return resolve((extension) => extension.submitLabel?.(mode), fallback);
}

export function resolveAuthEndpoint(mode: AuthMode, fallback: string): string {
  return resolve((extension) => extension.endpoint?.(mode), fallback);
}
