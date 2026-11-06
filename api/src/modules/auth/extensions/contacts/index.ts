import { authConfig } from '../../config.js';
import type { AuthExtension } from '../types.js';

/**
 * Контакти при реєстрації (телефон, Telegram).
 * Поля опційні — валідація на клієнті; збереження — наступний етап.
 */
export const extension: AuthExtension = {
  name: 'contacts',
  enabled: authConfig.contacts,
};
