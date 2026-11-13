/** Кабінет користувача: доступний будь-якому залогіненому користувачу */
import type { WebPlugin } from '$lib/constructor/types';
import OverviewBlock from './OverviewBlock.svelte';
import ProfileBlock from './ProfileBlock.svelte';
import { loadProfile } from './store.js';

export const cabinet: WebPlugin = {
  name: 'cabinet',
  blocks: {
    'cabinet.overview': OverviewBlock,
    'cabinet.profile': ProfileBlock,
  },
  nav: [
    { href: '/app', label: 'Огляд' },
    { href: '/app/profile', label: 'Профіль' },
  ],
  pages: [
    {
      id: 'cabinet',
      path: '/app',
      access: 'user',
      template: 'cabinet',
      title: 'Огляд',
      load: loadProfile,
      slots: { default: [{ block: 'cabinet.overview' }] },
    },
    {
      id: 'cabinet-profile',
      path: '/app/profile',
      access: 'user',
      template: 'cabinet',
      title: 'Профіль',
      load: loadProfile,
      slots: { default: [{ block: 'cabinet.profile' }] },
    },
  ],
};
