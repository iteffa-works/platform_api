/** Вхід і реєстрація (логіка — $lib/domain/auth) */
import type { WebPlugin } from '$lib/constructor/types';
import AuthFormBlock from './AuthFormBlock.svelte';

export const auth: WebPlugin = {
  name: 'auth',
  blocks: { 'auth.form': AuthFormBlock },
  pages: [
    {
      id: 'login',
      path: '/login',
      access: 'public',
      template: 'auth',
      slots: { default: [{ block: 'auth.form', props: { mode: 'login' } }] },
    },
    {
      id: 'register',
      path: '/register',
      access: 'public',
      template: 'auth',
      slots: { default: [{ block: 'auth.form', props: { mode: 'register' } }] },
    },
  ],
};
