/** Адмінка: користувачі й ролі; розділи видно за рівнями прав ролі */
import type { WebPlugin } from '$lib/constructor/types';
import RolesPanelBlock from './RolesPanelBlock.svelte';
import { loadRolesPage, loadUsersPage } from './store.js';
import UsersPanelBlock from './UsersPanelBlock.svelte';

export const admin: WebPlugin = {
  name: 'admin',
  blocks: {
    'admin.users': UsersPanelBlock,
    'admin.roles': RolesPanelBlock,
  },
  nav: [
    { href: '/admin', label: 'Користувачі', permission: ['users', 'view'] },
    { href: '/admin/roles', label: 'Ролі', permission: ['roles', 'view'] },
  ],
  pages: [
    {
      id: 'admin-users',
      path: '/admin',
      access: 'user',
      permission: ['users', 'view'],
      template: 'admin',
      title: 'Користувачі',
      subtitle: 'Призначення ролей користувачам платформи',
      load: loadUsersPage,
      slots: { default: [{ block: 'admin.users' }] },
    },
    {
      id: 'admin-roles',
      path: '/admin/roles',
      access: 'user',
      permission: ['roles', 'view'],
      template: 'admin',
      title: 'Ролі',
      subtitle: 'Роль — набір рівнів прав по розділах. Нові розділи зʼявляються тут автоматично, коли їх оголошує модуль.',
      load: loadRolesPage,
      slots: { default: [{ block: 'admin.roles' }] },
    },
  ],
};
