/** Інтерфейс журналу дій (server-driven): сторінка адмінки */
import type { PluginUi } from '../../../flowaxy/ui/index.js';
import { activityPage } from './admin.page.js';
import { messages } from './messages.js';

export const activityUi: PluginUi = { messages, pages: [activityPage] };
