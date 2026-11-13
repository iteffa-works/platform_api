import { captchaExtension } from './captcha/index.js';
import { formExtension } from './form/index.js';
import {
  collectAuthExtensionFields,
  listAuthExtensionHints,
  listAuthExtensionSlots,
  listAuthExtensions,
  registerAuthExtension,
  resolveAuthEndpoint,
  resolveAuthSubmitLabel,
  validateAuthExtensions,
} from './registry.js';

let ready = false;

/** Зареєструвати клієнтські auth-розширення */
export function registerAllAuthExtensions(): void {
  if (ready) return;
  registerAuthExtension(formExtension);
  registerAuthExtension(captchaExtension);
  ready = true;
}

export {
  collectAuthExtensionFields,
  listAuthExtensionHints,
  listAuthExtensionSlots,
  listAuthExtensions,
  registerAuthExtension,
  resolveAuthEndpoint,
  resolveAuthSubmitLabel,
  validateAuthExtensions,
};

export type {
  AuthClientExtension,
  AuthExtensionField,
  AuthExtensionHint,
  AuthExtensionSlot,
} from './types.js';
