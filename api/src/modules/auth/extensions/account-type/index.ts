import { HttpError } from '../../../../shared/http/index.js';
import { authConfig } from '../../config.js';
import type { AuthExtension, AuthHookContext } from '../types.js';

const KINDS = new Set(['client', 'business']);

async function beforeRegister(ctx: AuthHookContext): Promise<void> {
  const kind = String(ctx.body.accountKind ?? '').trim();
  if (!KINDS.has(kind)) {
    throw new HttpError(400, 'Оберіть тип акаунта');
  }
}

/** Тип акаунта: користувач або компанія */
export const extension: AuthExtension = {
  name: 'account-type',
  enabled: authConfig.accountType,
  beforeRegister,
};
