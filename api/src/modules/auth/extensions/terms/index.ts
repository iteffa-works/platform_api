import { HttpError } from '../../../../shared/http/index.js';
import { authConfig } from '../../config.js';
import type { AuthExtension, AuthHookContext } from '../types.js';

async function beforeRegister(ctx: AuthHookContext): Promise<void> {
  const accepted = ctx.body.termsAccepted === true || ctx.body.termsAccepted === 'true';
  if (!accepted) {
    throw new HttpError(400, 'Потрібно прийняти умови використання');
  }
}

/** Згода з умовами використання */
export const extension: AuthExtension = {
  name: 'terms',
  enabled: authConfig.terms,
  beforeRegister,
};
