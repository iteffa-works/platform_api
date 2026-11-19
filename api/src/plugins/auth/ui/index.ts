/** Інтерфейс auth (server-driven): адмінка користувачів і ролей */
import type { PluginUi } from '../../../flowaxy/ui/index.js';
import { messages } from './messages.js';
import { rolesPage } from './roles.page.js';
import { usersPage } from './users.page.js';

export const authUi: PluginUi = { messages, pages: [usersPage, rolesPage] };
