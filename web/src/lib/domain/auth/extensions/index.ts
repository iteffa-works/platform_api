import { captchaExtension } from './captcha/index.js';
import { registerAuthExtension } from './registry.js';

let ready = false;

/** Зареєструвати клієнтські auth-розширення */
export function registerAllAuthExtensions(): void {
  if (ready) return;
  registerAuthExtension(captchaExtension);
  ready = true;
}

export {
  collectAuthExtensionFields,
  listAuthExtensionSlots,
  registerAuthExtension,
  resolveAuthEndpoint,
  resolveAuthSubmitLabel,
  validateAuthExtensions,
} from './registry.js';

export type { AuthClientExtension, AuthExtensionField, AuthExtensionSlot } from './types.js';
