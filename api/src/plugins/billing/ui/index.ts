/** Інтерфейс білінгу (server-driven): сторінка адмінки */
import type { PluginUi } from '../../../flowaxy/ui/index.js';
import { billingPage } from './admin.page.js';
import { messages } from './messages.js';

export const billingUi: PluginUi = { messages, pages: [billingPage] };
