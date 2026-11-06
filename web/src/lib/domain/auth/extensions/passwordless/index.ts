import { authConfig } from '../../config.js';
import type { AuthClientExtension } from '../types.js';

export const passwordlessExtension: AuthClientExtension = {
  name: 'passwordless',
  enabled: authConfig.passwordless,
  hints: () => [
    {
      id: 'passwordless',
      zone: 'email',
      href: '/login',
      label: 'Вхід без пароля',
      tone: 'soft',
      modes: ['login'],
      order: 20,
    },
  ],
};
