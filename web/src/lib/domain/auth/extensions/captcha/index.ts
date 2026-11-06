import CaptchaSlot from '$lib/blocks/auth/extensions/CaptchaSlot.svelte';
import { authConfig } from '../../config.js';
import { getCaptchaAnswer, getCaptchaToken } from './state.js';
import type { AuthClientExtension } from '../types.js';

export const captchaExtension: AuthClientExtension = {
  name: 'captcha',
  enabled: authConfig.captcha,
  fields: () => [
    { key: 'captchaToken', getValue: () => getCaptchaToken() },
    { key: 'captchaAnswer', getValue: () => getCaptchaAnswer() },
  ],
  validate: () => {
    if (!getCaptchaToken()) return 'Завантажте код капчі';
    if (!getCaptchaAnswer().trim()) return 'Введіть код з зображення';
    return undefined;
  },
  slots: () => [{
    id: 'captcha',
    component: CaptchaSlot,
    order: 60,
    modes: ['login', 'register'],
  }],
};

export {
  getCaptchaAnswer,
  getCaptchaToken,
  onCaptchaRefreshRequest,
  requestCaptchaRefresh,
  resetCaptchaAnswer,
  setCaptchaAnswer,
  setCaptchaToken,
} from './state.js';
