import { authConfig } from '../../config.js';
import type { AuthClientExtension } from '../types.js';

export const forgotPasswordExtension: AuthClientExtension = {
  name: 'forgot-password',
  enabled: authConfig.forgotPassword,
  hints: () => [
    {
      id: 'forgot-password',
      zone: 'password',
      href: '/login',
      label: 'Підказка пароля',
      modes: ['login'],
      order: 10,
    },
  ],
};
