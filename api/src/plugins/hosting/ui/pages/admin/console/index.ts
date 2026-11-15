/** /admin/hosting/servers/[id] — консоль панелі сервера: розділи вкладками (`?tab=`) */
import { ui, type UiButton, type UiNode, type UiPage } from '../../../../../../core/ui/index.js';
import { HttpError } from '../../../../../../shared/http/index.js';
import { hosting } from '../../../../module.js';
import { ADMIN, badge, CONSOLE_TABS, consoleTabs, errorBanner, type ConsoleTab } from '../../../kit.js';
import { ConsoleContext, type ConsoleSection } from './context.js';
import { cronSection } from '../../../sections/cron.js';
import { databasesSection } from '../../../sections/databases.js';
import { dnsSection } from '../../../sections/dns.js';
import { ftpSection } from '../../../sections/ftp.js';
import { mailSection } from '../../../sections/mail.js';
import { overviewSection } from './overview.js';
import { settingsSection } from './settings.js';
import { sitesSection } from '../../../sections/sites.js';
import { sslSection } from '../../../sections/ssl.js';
import { usersSection } from './users.js';

const SECTIONS: Record<ConsoleTab, ConsoleSection> = {
  overview: overviewSection,
  users: usersSection,
  sites: sitesSection,
  dns: dnsSection,
  mail: mailSection,
  databases: databasesSection,
  ftp: ftpSection,
  ssl: sslSection,
  cron: cronSection,
  settings: settingsSection,
};

export const consolePage: UiPage = {
  path: `${ADMIN}/servers/[id]`,
  section: 'admin',
  title: 'console.title',
  permission: ['hosting', 'view'],
  async render(ctx) {
    const id = Number(ctx.params.id);
    if (!Number.isInteger(id) || id <= 0) throw new HttpError(404, 'Сервер не знайдено');
    const [server, { providers }] = await Promise.all([hosting.servers.view(id), hosting.servers.list()]);
    const console = new ConsoleContext(ctx, server, providers);
    const tab = (CONSOLE_TABS as readonly string[]).includes(ctx.state.tab ?? '') ? ctx.state.tab as ConsoleTab : 'overview';
    const provider = providers.find((item) => item.id === server.provider);

    const header: UiNode[] = [
      { type: 'breadcrumbs', items: [{ label: ctx.t('nav.overview'), href: ADMIN }, { label: ctx.t('servers'), href: `${ADMIN}/servers` }, { label: server.name }] },
      {
        type: 'row',
        justify: 'between',
        align: 'center',
        children: [
          ui.row([
            { type: 'status', tone: server.isActive ? 'green' : 'slate', icon: 'server' },
            ui.stack([
              { type: 'heading', text: server.name },
              ui.row([
                badge(provider?.title ?? server.provider, server.provider === 'sandbox' ? 'purple' : 'blue'),
                badge(server.isActive ? ctx.t('on') : ctx.t('off'), server.isActive ? 'green' : 'slate'),
                ...(server.verifyTls ? [] : [badge(ctx.t('tlsOff'), 'orange')]),
                ui.muted(server.url),
              ]),
            ], 2),
          ]),
        ],
      },
      consoleTabs(ctx, id, tab, console.owner),
    ];
    // Дії консолі — у шапці сторінки: оновити дані панелі (скинути кеш), перевірити, діагностика
    const actions: UiButton[] = [
      { type: 'button', variant: 'ghost', label: ctx.t('refreshData'), icon: 'refresh', action: { method: 'POST', url: `${ADMIN}/servers/${id}/panel/refresh` } },
      ...(console.manage ? [
        { type: 'button' as const, variant: 'ghost' as const, label: ctx.t('check'), icon: 'check', action: { method: 'POST' as const, url: `${ADMIN}/servers/${id}/check`, success: { notice: ctx.t('checkOk', { server: server.name, accounts: '{accounts}', packages: '{packages}' }), errorKey: 'error', reload: false } } },
        { type: 'button' as const, variant: 'ghost' as const, label: ctx.t('diagnostics'), icon: 'help', action: { method: 'GET' as const, url: `${ADMIN}/servers/${id}/diagnostics`, success: { result: { key: 'diagnostics', format: 'json' as const, title: ctx.t('diagnostics'), text: ctx.t('diagnosticsHint') }, reload: false } } },
      ] : []),
    ];

    if (!server.isActive && tab !== 'settings') {
      return { nodes: [...header, { type: 'banner', tone: 'orange', text: ctx.t('serverDisabled') }], actions };
    }
    try {
      return { nodes: [...header, ...(await SECTIONS[tab](console))], actions };
    } catch (error) {
      if (error instanceof HttpError && error.status !== 502) throw error;
      return { nodes: [...header, errorBanner(ctx, error)], actions };
    }
  },
};
