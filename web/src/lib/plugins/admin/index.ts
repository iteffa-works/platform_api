/** Адмінка: огляд, користувачі, ролі, білінг, журнал; розділи видно за рівнями прав ролі */
import type { WebPlugin } from '$lib/constructor/types';
import ActivityAdminBlock from './ActivityAdminBlock.svelte';
import BillingAdminBlock from './BillingAdminBlock.svelte';
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
    'admin.billing': BillingAdminBlock,
    'admin.activity': ActivityAdminBlock,
  },
  nav: [
    { href: '/admin', label: 'nav.dashboard', icon: 'dashboard', group: 'nav.group.overview', pinned: true, permission: ['admin.panel', 'view'] },
    { href: '/admin/users', label: 'nav.users', icon: 'users', group: 'nav.group.access', pinned: true, permission: ['users', 'view'] },
    { href: '/admin/roles', label: 'nav.roles', icon: 'key', group: 'nav.group.access', pinned: true, permission: ['roles', 'view'] },
    { href: '/admin/billing', label: 'nav.billingAdmin', icon: 'wallet', group: 'nav.group.system', pinned: true, permission: ['billing', 'view'] },
    { href: '/admin/activity', label: 'nav.activityAdmin', icon: 'list', group: 'nav.group.system', permission: ['logs', 'view'] },
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
      title: 'nav.users',
      subtitle: 'users.subtitle',
      load: loadUsersPage,
      slots: { default: [{ block: 'admin.users' }] },
    },
    {
      id: 'admin-roles',
      path: '/admin/roles',
      access: 'user',
      permission: ['roles', 'view'],
      template: 'admin',
      title: 'nav.roles',
      subtitle: 'roles.subtitle',
      load: loadRolesPage,
      slots: { default: [{ block: 'admin.roles' }] },
    },
    {
      id: 'admin-billing',
      path: '/admin/billing',
      access: 'user',
      permission: ['billing', 'view'],
      template: 'admin',
      title: 'nav.billingAdmin',
      subtitle: 'billing.adminSubtitle',
      slots: { default: [{ block: 'admin.billing' }] },
    },
    {
      id: 'admin-activity',
      path: '/admin/activity',
      access: 'user',
      permission: ['logs', 'view'],
      template: 'admin',
      title: 'nav.activityAdmin',
      subtitle: 'activity.adminSubtitle',
      slots: { default: [{ block: 'admin.activity' }] },
    },
  ],
};
