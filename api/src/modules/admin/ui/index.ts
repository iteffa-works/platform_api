/**
 * Інтерфейс адмінки (server-driven): сторінки ядра описуються тут деревом вузлів з даними,
 * web рендерить їх UI-китом робочого простору. Меню адмінки — у web (модуль ядра `admin`).
 */
import type { PluginUi, UiPage } from '../../../core/ui/index.js';
import { HttpError } from '../../../shared/http/index.js';
import { activityPage } from './activity.js';
import { billingPage } from './billing.js';
import { messages } from './messages.js';
import { overviewPage } from './overview.js';
import { pluginsPage } from './plugins.js';
import { rolesPage } from './roles.js';
import { usersPage } from './users.js';

/** Кожна сторінка адмінки потребує доступу до адмінки, крім права свого розділу */
function inAdmin(page: UiPage): UiPage {
  return {
    ...page,
    render: async (ctx) => {
      if (!ctx.can('admin.panel', 'view')) throw new HttpError(403, 'Недостатньо прав');
      return page.render(ctx);
    },
  };
}

export const adminUi: PluginUi = {
  messages,
  pages: [overviewPage, usersPage, rolesPage, billingPage, activityPage, pluginsPage].map(inAdmin),
};
