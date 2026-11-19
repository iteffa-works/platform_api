/**
 * /admin/hosting/servers/[id] — сервер панелі: стан і синхронізація, користувачі панелі (привʼязка до платформи),
 * налаштування. Ресурсами клієнтів адміністратор не керує тут — це робить клієнт у кабінеті.
 */
import { ui, type UiButton, type UiNode, type UiPage } from '../../../../../../flowaxy/ui/index.js';
import { HttpError } from '../../../../../../shared/http/index.js';
import { hosting } from '../../../../module.js';
import { ADMIN, badge, errorBanner } from '../../../kit.js';
import { ServerContext, type ServerTab } from './context.js';
import { overviewTab } from './overview.js';
import { settingsTab } from './settings.js';
import { usersTab } from './users.js';

const TABS = { overview: overviewTab, users: usersTab, settings: settingsTab } satisfies Record<string, ServerTab>;
type TabName = keyof typeof TABS;

export const serverPage: UiPage = {
  path: `${ADMIN}/servers/[id]`,
  section: 'admin',
  title: 'console.title',
  permission: ['hosting', 'view'],
  async render(ctx) {
    const id = Number(ctx.params.id);
    if (!Number.isInteger(id) || id <= 0) throw new HttpError(404, 'Сервер не знайдено');
    const server = await hosting.servers.view(id);
    const page = new ServerContext(ctx, server, hosting.providers.list());
    const tab: TabName = ctx.state.tab && ctx.state.tab in TABS ? ctx.state.tab as TabName : 'overview';
    const provider = page.providers.find((item) => item.id === server.provider);

    const header: UiNode[] = [
      { type: 'breadcrumbs', items: [{ label: ctx.t('section.servers'), href: `${ADMIN}/servers` }, { label: server.name }] },
      ui.row([
        { type: 'status', tone: !server.isActive ? 'slate' : server.syncError ? 'orange' : 'green', icon: 'server' },
        ui.stack([
          { type: 'heading', text: server.name },
          ui.row([
            badge(provider?.title ?? server.provider, 'blue'),
            badge(server.isActive ? ctx.t('on') : ctx.t('off'), server.isActive ? 'green' : 'slate'),
            ...(server.verifyTls ? [] : [badge(ctx.t('tlsOff'), 'orange')]),
            ui.muted(server.url),
          ]),
        ], 2),
      ]),
      {
        type: 'tabs',
        variant: 'pills',
        items: (Object.keys(TABS) as TabName[]).map((item) => ({ label: ctx.t(`tab.${item}`), href: item === 'overview' ? page.page : `${page.page}?tab=${item}`, active: item === tab })),
      },
    ];

    // Дії сервера — у шапці сторінки
    const actions: UiButton[] = [
      { type: 'button', variant: 'ghost', label: ctx.t('sync'), icon: 'refresh', action: { method: 'POST', url: `${page.api}/sync`, success: { notice: ctx.t('synced', { changes: '{changes}' }) } } },
      ...(page.manage ? [
        { type: 'button' as const, variant: 'ghost' as const, label: ctx.t('check'), icon: 'check', action: { method: 'POST' as const, url: `${page.api}/check`, success: { notice: ctx.t('checkOk', { server: server.name, accounts: '{accounts}', packages: '{packages}' }), errorKey: 'error', reload: false } } },
        { type: 'button' as const, variant: 'ghost' as const, label: ctx.t('diagnostics'), icon: 'help', action: { method: 'GET' as const, url: `${page.api}/diagnostics`, success: { result: { key: 'diagnostics', format: 'json' as const, title: ctx.t('diagnostics'), text: ctx.t('diagnosticsHint') }, reload: false } } },
      ] : []),
    ];

    try {
      return { nodes: [...header, ...(await TABS[tab](page))], actions };
    } catch (error) {
      if (error instanceof HttpError && error.status !== 502) throw error;
      return { nodes: [...header, errorBanner(ctx, error)], actions };
    }
  },
};
