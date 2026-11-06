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
      label: 'Забули пароль?',
      modes: ['login'],
      order: 10,
    },
  ],
};
