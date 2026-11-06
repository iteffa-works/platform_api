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
      label: 'Створити акаунт',
      modes: ['login'],
      order: 10,
    },
    {
      id: 'to-login',
      zone: 'footer',
      href: '/login',
      label: 'Уже є акаунт? Увійти',
      modes: ['register'],
      order: 10,
    },
  ],
};

/** Зручний доступ (не обовʼязково) */
export function registerLinkFor(mode: AuthMode) {
  return registerLinkExtension.hints?.().find((h) => h.modes?.includes(mode));
}
