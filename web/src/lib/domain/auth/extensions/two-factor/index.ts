import { authConfig } from '../../config.js';
import type { AuthClientExtension } from '../types.js';

export const twoFactorExtension: AuthClientExtension = {
  name: 'two-factor',
  enabled: authConfig.twoFactor,
};
