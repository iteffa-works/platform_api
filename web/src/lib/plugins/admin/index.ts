/**
 * Адмінка: меню розділів (видно за рівнями прав ролі).
 * Сторінки рендерить API (server-driven: api/src/modules/admin/ui) — web малює їх UI-китом через remote.page.
 */
import type { WebPlugin } from '$lib/constructor/types';

export const admin: WebPlugin = {
  name: 'admin',
  nav: [
    { href: '/admin', label: 'nav.dashboard', icon: 'dashboard', group: 'nav.group.overview', pinned: true, permission: ['admin.panel', 'view'] },
    { href: '/admin/users', label: 'nav.users', icon: 'users', group: 'nav.group.access', pinned: true, permission: ['users', 'view'] },
    { href: '/admin/roles', label: 'nav.roles', icon: 'key', group: 'nav.group.access', pinned: true, permission: ['roles', 'view'] },
    { href: '/admin/billing', label: 'nav.billingAdmin', icon: 'wallet', group: 'nav.group.system', pinned: true, permission: ['billing', 'view'] },
    { href: '/admin/activity', label: 'nav.activityAdmin', icon: 'list', group: 'nav.group.system', permission: ['logs', 'view'] },
    { href: '/admin/plugins', label: 'nav.plugins', icon: 'plug', group: 'nav.group.system', permission: ['plugins', 'view'] },
  ],
};
