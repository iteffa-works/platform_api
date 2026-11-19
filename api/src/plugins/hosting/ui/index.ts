/** Інтерфейс хостингу (server-driven UI): меню, сервіс у «Сервісах», сторінки кабінету й адмінки */
import type { PluginUi } from '../../../flowaxy/ui/index.js';
import { messages } from './messages/index.js';
import { accountPage } from './pages/admin/account.page.js';
import { accountsPage } from './pages/admin/accounts.page.js';
import { overviewPage } from './pages/admin/overview.page.js';
import { plansPage } from './pages/admin/plans.page.js';
import { serverPage } from './pages/admin/server/index.js';
import { serversPage } from './pages/admin/servers.page.js';
import { cabinetPages } from './pages/cabinet/index.js';
import { inSection } from './section.js';

const GROUP = 'nav.group';
const VIEW: ['hosting', 'view'] = ['hosting', 'view'];

export const hostingUi: PluginUi = {
  messages,
  services: [{ href: '/app/hosting', label: 'service', icon: 'server', tone: 'green' }],
  nav: [
    { section: 'cabinet', href: '/app/hosting', label: 'nav.hosting', icon: 'server' },
    // Адмінка: один розділ — вкладки (огляд, акаунти, сервери, тарифи) усередині сторінок
    { section: 'admin', href: '/admin/hosting', label: 'nav.hosting', icon: 'server', group: GROUP, permission: VIEW },
  ],
  pages: [
    ...cabinetPages,
    inSection(overviewPage, 'overview'),
    inSection(accountsPage, 'accounts'),
    inSection(accountPage, 'accounts'),
    inSection(serversPage, 'servers'),
    inSection(serverPage, 'servers'),
    inSection(plansPage, 'plans'),
  ],
};
