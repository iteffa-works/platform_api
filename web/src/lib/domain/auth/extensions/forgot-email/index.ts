import { authConfig } from '../../config.js';
import type { AuthClientExtension } from '../types.js';

export const forgotEmailExtension: AuthClientExtension = {
  name: 'forgot-email',
  enabled: authConfig.forgotEmail,
  hints: () => [
    {
      id: 'forgot-email',
      zone: 'email',
      href: '/login',
      label: 'Забули email?',
      modes: ['login'],
      order: 10,
    },
  ],
};
