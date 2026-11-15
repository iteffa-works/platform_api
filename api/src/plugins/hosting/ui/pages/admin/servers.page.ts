/** /admin/hosting/servers — сервери панелей: список, підключення, швидкі дії */
import { ui, type UiNode, type UiPage } from '../../../../../core/ui/index.js';
import { hosting } from '../../../module.js';
import { countryName } from '../../format.js';
import { action, ADMIN, badge, dialogButton, menu, onOff, panel, removeAction, serverForm, table } from '../../kit.js';

export const serversPage: UiPage = {
  path: `${ADMIN}/servers`,
  section: 'admin',
  title: 'nav.servers',
  subtitle: 'servers.subtitle',
  permission: ['hosting', 'view'],
  async render(ctx) {
    const manage = ctx.can('hosting', 'manage');
    const { servers, providers } = await hosting.servers.list();
    const providerTitle = (id: string) => providers.find((item) => item.id === id)?.title ?? id;
    const actions: UiNode[] = manage ? [dialogButton(ctx.t('addServer'), ctx.t('addServer'), [serverForm(ctx, providers)])] : [];

    return [panel(`${ctx.t('servers')} · ${servers.length}`, [table(
      [
        { key: 'server', label: ctx.t('server') },
        { key: 'provider', label: ctx.t('provider') },
        { key: 'location', label: ctx.t('col.location') },
        { key: 'accounts', label: ctx.t('accounts'), align: 'right' },
        { key: 'status', label: ctx.t('status') },
        { key: 'actions', label: '', align: 'right', width: '48px' },
      ],
      servers.map((server) => {
        const url = `${ADMIN}/servers/${server.id}`;
        return {
          key: server.id,
          muted: !server.isActive,
          cells: {
            server: [{ type: 'link', text: server.name, href: url }, ui.muted(server.url)],
            provider: [badge(providerTitle(server.provider), server.provider === 'sandbox' ? 'purple' : 'blue'), ...(server.verifyTls ? [] : [badge(ctx.t('tlsOff'), 'orange')])],
            location: [ui.row([{ type: 'flag', code: server.location }, ui.text(countryName(server.location, ctx.lang), { size: 'sm' })]), ...(server.ipv4 ? [ui.muted(server.ipv4)] : [])],
            accounts: [ui.text(server.maxAccounts ? `${server.accounts} / ${server.maxAccounts}` : String(server.accounts))],
            status: [onOff(ctx, server.isActive), ...(server.isActive && !server.isPublic ? [badge(ctx.t('private'))] : [])],
            actions: [menu([
              { type: 'button', variant: 'ghost', label: ctx.t('openConsole'), href: url },
              manage && action(ctx.t('check'), { method: 'POST', url: `${url}/check`, success: { notice: ctx.t('checkOk', { server: server.name, accounts: '{accounts}', packages: '{packages}' }), errorKey: 'error', reload: false } }),
              manage && action(server.isActive ? ctx.t('disable') : ctx.t('enable'), { method: 'PATCH', url, body: { isActive: !server.isActive } }),
              manage && server.accounts === 0 && removeAction(ctx.t('delete'), url, ctx.t('deleteServerConfirm', { server: server.name })),
            ])],
          },
        };
      }),
      ctx.t('noServers'),
    )], { flush: true, actions })];
  },
};
