import TermsSlot from '$lib/blocks/auth/extensions/TermsSlot.svelte';
import { authConfig } from '../../config.js';
import type { AuthClientExtension } from '../types.js';
import { getTermsAccepted } from './state.js';

export const termsExtension: AuthClientExtension = {
  name: 'terms',
  enabled: authConfig.terms,
  modes: ['register'],
  fields: () => [{ key: 'termsAccepted', getValue: () => getTermsAccepted() }],
  validate: () => (getTermsAccepted() ? undefined : 'Потрібно прийняти умови використання'),
  slots: () => [{
    id: 'terms',
    component: TermsSlot,
    order: 80,
    modes: ['register'],
  }],
};

export { getTermsAccepted, setTermsAccepted } from './state.js';
