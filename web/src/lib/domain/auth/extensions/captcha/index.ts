import CaptchaSlot from '$lib/plugins/auth/CaptchaSlot.svelte';
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
    // Повертають ключі перекладів — текст будує форма
    if (!getCaptchaToken()) return 'captcha.notLoaded';
    if (!getCaptchaAnswer().trim()) return 'captcha.enterCode';
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
