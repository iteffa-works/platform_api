import { authConfig, type AuthMode } from '../../config.js';
import type { AuthClientExtension } from '../types.js';

/** Форма email+пароль: endpoints і підписи CTA */
export const formExtension: AuthClientExtension = {
  name: 'form',
  enabled: authConfig.form,
  endpoint: (mode: AuthMode) => (mode === 'register' ? '/auth/register' : '/auth/login'),
  submitLabel: (mode: AuthMode) => (mode === 'register' ? 'Кнопка реєстрації' : 'Кнопка входу'),
};

/** Підпис кнопки login у split-макеті */
export const loginSubmitLabel = 'Кнопка входу';
