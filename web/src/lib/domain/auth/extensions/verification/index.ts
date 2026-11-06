import VerificationSlot from '$lib/blocks/auth/extensions/VerificationSlot.svelte';
import { authConfig } from '../../config.js';
import type { AuthClientExtension } from '../types.js';
import { getInviteCode, getVerificationMethod } from './state.js';

export const verificationExtension: AuthClientExtension = {
  name: 'verification',
  enabled: authConfig.verification,
  modes: ['register'],
  fields: () => [
    { key: 'verificationMethod', getValue: () => getVerificationMethod() },
    { key: 'inviteCode', getValue: () => getInviteCode() },
  ],
  validate: () => {
    const method = getVerificationMethod();
    if (!method) return 'Оберіть спосіб верифікації';
    if (method === 'invite' && !getInviteCode().trim()) return 'Введіть код запрошення';
    if (method === 'phone') return 'Верифікація телефоном скоро буде доступна';
    return undefined;
  },
  slots: () => [{
    id: 'verification',
    component: VerificationSlot,
    order: 10,
    modes: ['register'],
  }],
};

export {
  getInviteCode,
  getVerificationMethod,
  setInviteCode,
  setVerificationMethod,
} from './state.js';
export type { VerificationMethod } from './state.js';
