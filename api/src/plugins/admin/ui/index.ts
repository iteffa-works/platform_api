/**
 * Інтерфейс адмінки (server-driven): панель-огляд з внесків плагінів і керування плагінами.
 * Розділи даних (користувачі, ролі, білінг, журнал, хостинг…) — сторінки плагінів-власників.
 */
import type { PluginUi } from '../../../flowaxy/ui/index.js';
import { messages } from './messages.js';
import { overviewPage } from './overview.js';
import { pluginsPage } from './plugins.js';

export const adminUi: PluginUi = { messages, pages: [overviewPage, pluginsPage] };
