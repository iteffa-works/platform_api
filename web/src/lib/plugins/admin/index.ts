/** Адмінка: огляд, користувачі й ролі; розділи видно за рівнями прав ролі */
import type { WebPlugin } from '$lib/constructor/types';
import OverviewBlock from './OverviewBlock.svelte';
import RolesPanelBlock from './RolesPanelBlock.svelte';
import { loadOverviewPage, loadRolesPage, loadUsersPage } from './store.js';
import UsersPanelBlock from './UsersPanelBlock.svelte';

export const admin: WebPlugin = {
  name: 'admin',
  blocks: {
    'admin.overview': OverviewBlock,
    'admin.users': UsersPanelBlock,
    'admin.roles': RolesPanelBlock,
  },
  nav: [
    { href: '/admin', label: 'Панель', icon: 'dashboard', group: 'Огляд', pinned: true, permission: ['admin.panel', 'view'] },
    { href: '/admin/users', label: 'Користувачі', icon: 'users', group: 'Користувачі й доступ', pinned: true, permission: ['users', 'view'] },
    { href: '/admin/roles', label: 'Ролі', icon: 'key', group: 'Користувачі й доступ', pinned: true, permission: ['roles', 'view'] },
  ],
  pages: [
    {
      id: 'admin-overview',
      path: '/admin',
      access: 'user',
      permission: ['admin.panel', 'view'],
      template: 'admin',
      // Заголовок — привітання в самому блоці
      load: loadOverviewPage,
      slots: { default: [{ block: 'admin.overview' }] },
    },
    {
      id: 'admin-users',
      path: '/admin/users',
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
