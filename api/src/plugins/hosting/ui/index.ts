/** Інтерфейс хостингу (server-driven UI): меню, сервіс у «Сервісах», сторінки кабінету й адмінки */
import type { PluginUi } from '../../../core/ui/index.js';
import { messages } from './messages/index.js';
import { accountsPage } from './pages/admin/accounts.page.js';
import { consolePage } from './pages/admin/console/index.js';
import { overviewPage } from './pages/admin/overview.page.js';
import { plansPage } from './pages/admin/plans.page.js';
import { serversPage } from './pages/admin/servers.page.js';
import { cabinetPages } from './pages/cabinet/index.js';

const GROUP = 'nav.group';
const VIEW: ['hosting', 'view'] = ['hosting', 'view'];

export const hostingUi: PluginUi = {
  messages,
  services: [{ href: '/app/hosting', label: 'service', icon: 'server', tone: 'green' }],
  nav: [
    { section: 'cabinet', href: '/app/hosting', label: 'nav.hosting', icon: 'server' },
    { section: 'admin', href: '/admin/hosting', label: 'nav.overview', icon: 'dashboard', group: GROUP, pinned: true, permission: VIEW },
    { section: 'admin', href: '/admin/hosting/accounts', label: 'nav.accounts', icon: 'users', group: GROUP, permission: VIEW },
    { section: 'admin', href: '/admin/hosting/servers', label: 'nav.servers', icon: 'server', group: GROUP, permission: VIEW },
    { section: 'admin', href: '/admin/hosting/plans', label: 'nav.plans', icon: 'wallet', group: GROUP, permission: VIEW },
  ],
  pages: [...cabinetPages, overviewPage, accountsPage, serversPage, plansPage, consolePage],
};
