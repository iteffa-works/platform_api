import type { AuthMode } from '../config.js';
import type {
  AuthClientExtension,
  AuthExtensionField,
  AuthExtensionHint,
  AuthExtensionSlot,
} from './types.js';

const extensions = new Map<string, AuthClientExtension>();

export function registerAuthExtension(extension: AuthClientExtension): void {
  extensions.set(extension.name, extension);
}

export function listAuthExtensions(): AuthClientExtension[] {
  return [...extensions.values()].filter((item) => item.enabled !== false);
}

export function listAuthExtensionSlots(mode?: AuthMode): AuthExtensionSlot[] {
  return listAuthExtensions()
    .flatMap((item) => item.slots?.() ?? [])
    .filter((slot) => !mode || !slot.modes || slot.modes.includes(mode))
    .sort((a, b) => (a.order ?? 100) - (b.order ?? 100));
}

export function listAuthExtensionHints(zone: AuthExtensionHint['zone'], mode: AuthMode): AuthExtensionHint[] {
  return listAuthExtensions()
    .flatMap((item) => item.hints?.() ?? [])
    .filter((hint) => hint.zone === zone)
    .filter((hint) => !hint.modes || hint.modes.includes(mode))
    .sort((a, b) => (a.order ?? 100) - (b.order ?? 100));
}

function extensionAppliesToMode(extension: AuthClientExtension, mode: AuthMode): boolean {
  return !extension.modes || extension.modes.includes(mode);
}

export function collectAuthExtensionFields(mode: AuthMode): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const extension of listAuthExtensions()) {
    if (!extensionAppliesToMode(extension, mode)) continue;
    for (const field of extension.fields?.() ?? []) {
      payload[field.key] = field.getValue();
    }
  }
  return payload;
}

export function validateAuthExtensions(mode: AuthMode): string | undefined {
  for (const extension of listAuthExtensions()) {
    if (!extensionAppliesToMode(extension, mode)) continue;
    const message = extension.validate?.();
    if (message) return message;
  }
  return undefined;
}

export function resolveAuthSubmitLabel(mode: AuthMode, fallback: string): string {
  for (const extension of listAuthExtensions()) {
    const label = extension.submitLabel?.(mode);
    if (label) return label;
  }
  return fallback;
}

export function resolveAuthEndpoint(mode: AuthMode, fallback: string): string {
  for (const extension of listAuthExtensions()) {
    const endpoint = extension.endpoint?.(mode);
    if (endpoint) return endpoint;
  }
  return fallback;
}

export type { AuthExtensionField };
