import { authConfig, type AuthMode } from '../../config.js';
import type { AuthClientExtension } from '../types.js';

export const registerLinkExtension: AuthClientExtension = {
  name: 'register-link',
  enabled: authConfig.registerLink,
  hints: () => [
    {
      id: 'to-register',
      zone: 'footer',
      href: '/register',
      label: 'Посилання на реєстрацію',
      modes: ['login'],
      order: 10,
    },
    {
      id: 'to-login',
      zone: 'footer',
      href: '/login',
      label: 'Посилання на вхід',
      modes: ['register'],
      order: 10,
    },
  ],
};

/** Зручний доступ (не обовʼязково) */
export function registerLinkFor(mode: AuthMode) {
  return registerLinkExtension.hints?.().find((h) => h.modes?.includes(mode));
}
