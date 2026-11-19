/** Налаштування сервера: підключення, розташування, ліміти; небезпечна зона */
import { ui, type UiNode } from '../../../../../../flowaxy/ui/index.js';
import { action, ADMIN, panel, removeAction, serverForm } from '../../../kit.js';
import type { ServerTab } from './context.js';

export const settingsTab: ServerTab = async (page) => {
  const { t, server } = page;
  if (!page.manage) return [panel(t('tab.settings'), [ui.muted(t('noManage'))])];

  const nodes: UiNode[] = [panel(t('editServer'), [serverForm(page.ctx, page.providers, server, `${page.page}?tab=settings`)])];
  nodes.push(panel(t('danger'), [
    ui.row([
      action(server.isActive ? t('disableServer') : t('enableServer'), { method: 'PATCH', url: `${ADMIN}/servers/${server.id}`, body: { isActive: !server.isActive }, confirm: server.isActive ? t('disableServerConfirm') : undefined }),
      ...(server.accounts === 0 ? [removeAction(t('deleteServer'), `${ADMIN}/servers/${server.id}`, t('deleteServerConfirm', { server: server.name }))] : []),
    ]),
    ui.muted(server.accounts ? t('deleteServerBlocked', { count: server.accounts }) : t('deleteServerHint')),
  ]));
  return nodes;
};
