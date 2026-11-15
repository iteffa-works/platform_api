/** Налаштування сервера: підключення, розташування, ліміти; небезпечна зона */
import { ui, type UiNode } from '../../../../../../core/ui/index.js';
import { action, ADMIN, panel, removeAction, serverForm } from '../../../kit.js';
import type { ConsoleSection } from './context.js';

export const settingsSection: ConsoleSection = async (console) => {
  const { t, server } = console;
  if (!console.manage) return [panel(t('tab.settings'), [ui.muted(t('noManage'))])];

  const nodes: UiNode[] = [panel(t('editServer'), [serverForm(console.ctx, console.providers, server, `${console.page}?tab=settings`)])];
  nodes.push(panel(t('danger'), [
    ui.row([
      action(server.isActive ? t('disableServer') : t('enableServer'), { method: 'PATCH', url: `${ADMIN}/servers/${server.id}`, body: { isActive: !server.isActive }, confirm: server.isActive ? t('disableServerConfirm') : undefined }),
      ...(server.accounts === 0 ? [removeAction(t('deleteServer'), `${ADMIN}/servers/${server.id}`, t('deleteServerConfirm', { server: server.name }))] : []),
    ]),
    ui.muted(server.accounts ? t('deleteServerBlocked', { count: server.accounts }) : t('deleteServerHint')),
  ]));
  return nodes;
};
