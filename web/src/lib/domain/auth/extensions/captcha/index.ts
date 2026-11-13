import CaptchaSlot from '$lib/blocks/auth/extensions/CaptchaSlot.svelte';
import { authConfig } from '../../config.js';
import type { AuthClientExtension } from '../types.js';
import { getCaptchaAnswer, getCaptchaToken, isCaptchaEnabled } from './state.js';

export const captchaExtension: AuthClientExtension = {
  name: 'captcha',
  enabled: authConfig.captcha,
  fields: () => (isCaptchaEnabled()
    ? [
        { key: 'captchaToken', getValue: getCaptchaToken },
        { key: 'captchaAnswer', getValue: getCaptchaAnswer },
      ]
    : []),
  validate: () => {
    if (!isCaptchaEnabled()) return undefined;
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
  onCaptchaRefreshRequest,
  requestCaptchaRefresh,
  setCaptchaAnswer,
  setCaptchaEnabled,
  setCaptchaToken,
} from './state.js';
