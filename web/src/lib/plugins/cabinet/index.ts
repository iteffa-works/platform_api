/** Кабінет користувача: огляд і власний акаунт (без окремих прав) */
import type { PageDefinition, WebPlugin } from '$lib/constructor/types';
import AccessBlock from './AccessBlock.svelte';
import AccountBlock from './AccountBlock.svelte';
import OverviewBlock from './OverviewBlock.svelte';
import PreferencesBlock from './PreferencesBlock.svelte';
import { loadProfile } from './store.js';

/** Сторінка кабінету: шаблон, доступ і дані профілю спільні */
function page(id: string, path: string, title: string, block: string): PageDefinition {
  return {
    id,
    path,
    access: 'user',
    template: 'cabinet',
    title,
    load: loadProfile,
    slots: { default: [{ block }] },
  };
}

export const cabinet: WebPlugin = {
  name: 'cabinet',
  blocks: {
    'cabinet.overview': OverviewBlock,
    'cabinet.account': AccountBlock,
    'cabinet.preferences': PreferencesBlock,
    'cabinet.access': AccessBlock,
  },
  nav: [
    { href: '/app', label: 'Огляд', icon: 'dashboard' },
    // group 'account' — другий ряд вкладок і меню акаунта
    { href: '/app/account', label: 'Акаунт', icon: 'user', group: 'account' },
    { href: '/app/preferences', label: 'Налаштування', icon: 'sliders', group: 'account' },
    { href: '/app/access', label: 'Доступи', icon: 'key', group: 'account' },
  ],
  pages: [
    page('cabinet', '/app', 'Огляд', 'cabinet.overview'),
    page('cabinet-account', '/app/account', 'Акаунт', 'cabinet.account'),
    page('cabinet-preferences', '/app/preferences', 'Налаштування', 'cabinet.preferences'),
    page('cabinet-access', '/app/access', 'Доступи', 'cabinet.access'),
  ],
};
