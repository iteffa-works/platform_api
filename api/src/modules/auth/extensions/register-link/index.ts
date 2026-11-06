import { authConfig } from '../../config.js';
import type { AuthExtension } from '../types.js';

/**
 * Розширення CTA реєстрації / зворотного входу.
 * API-маршрутів немає — керує наявністю посилання на клієнті.
 */
export const extension: AuthExtension = {
  name: 'register-link',
  enabled: authConfig.registerLink,
};
