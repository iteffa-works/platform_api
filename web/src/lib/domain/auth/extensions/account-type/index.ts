import AccountTypeSlot from '$lib/blocks/auth/extensions/AccountTypeSlot.svelte';
import { authConfig } from '../../config.js';
import type { AuthClientExtension } from '../types.js';
import { getAccountKind } from './state.js';

export const accountTypeExtension: AuthClientExtension = {
  name: 'account-type',
  enabled: authConfig.accountType,
  modes: ['register'],
  fields: () => [{ key: 'accountKind', getValue: () => getAccountKind() }],
  validate: () => (getAccountKind() ? undefined : 'Оберіть тип акаунта'),
  slots: () => [{
    id: 'account-type',
    component: AccountTypeSlot,
    order: 30,
    modes: ['register'],
  }],
};

export { getAccountKind, setAccountKind } from './state.js';
export type { AccountKind } from './state.js';
