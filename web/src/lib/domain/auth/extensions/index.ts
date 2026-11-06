import { accountTypeExtension } from './account-type/index.js';
import { captchaExtension } from './captcha/index.js';
import { contactsExtension } from './contacts/index.js';
import { forgotEmailExtension } from './forgot-email/index.js';
import { forgotPasswordExtension } from './forgot-password/index.js';
import { formExtension } from './form/index.js';
import { passwordlessExtension } from './passwordless/index.js';
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
import { registerLinkExtension } from './register-link/index.js';
import { termsExtension } from './terms/index.js';
import { twoFactorExtension } from './two-factor/index.js';
import { verificationExtension } from './verification/index.js';

let ready = false;

/** Зареєструвати всі клієнтські auth-розширення */
export function registerAllAuthExtensions(): void {
  if (ready) return;
  registerAuthExtension(formExtension);
  registerAuthExtension(forgotEmailExtension);
  registerAuthExtension(passwordlessExtension);
  registerAuthExtension(forgotPasswordExtension);
  registerAuthExtension(verificationExtension);
  registerAuthExtension(accountTypeExtension);
  registerAuthExtension(contactsExtension);
  registerAuthExtension(captchaExtension);
  registerAuthExtension(termsExtension);
  registerAuthExtension(registerLinkExtension);
  registerAuthExtension(twoFactorExtension);
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
