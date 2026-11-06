import ContactsSlot from '$lib/blocks/auth/extensions/ContactsSlot.svelte';
import { authConfig } from '../../config.js';
import type { AuthClientExtension } from '../types.js';
import { getMessenger, getPhone } from './state.js';

export const contactsExtension: AuthClientExtension = {
  name: 'contacts',
  enabled: authConfig.contacts,
  modes: ['register'],
  fields: () => [
    { key: 'phone', getValue: () => getPhone() },
    { key: 'messenger', getValue: () => getMessenger() },
  ],
  slots: () => [{
    id: 'contacts',
    component: ContactsSlot,
    order: 40,
    modes: ['register'],
  }],
};

export { getMessenger, getPhone, setMessenger, setPhone } from './state.js';
