import { authConfig } from '../../config.js';
import type { AuthExtension } from '../types.js';

/** Stub двофакторної авторизації */
export const extension: AuthExtension = {
  name: 'two-factor',
  enabled: authConfig.twoFactor,
  async afterLogin() {
    // Challenge-flow пізніше
  },
};
