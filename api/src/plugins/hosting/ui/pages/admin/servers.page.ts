/** /admin/hosting/servers — сервери панелей: фільтр провайдера / стану, пошук, сортування, швидкі дії */
import { ui, type UiPage } from '../../../../../core/ui/index.js';
import { hosting } from '../../../module.js';
import { countryName } from '../../format.js';
import { datagrid, gridQuery, localGrid, searchBox } from '../../grid.js';
import { ADMIN, badge, onOff, serverForm, usagePercent, usageTone } from '../../kit.js';

export const serversPage: UiPage = {
  path: `${ADMIN}/servers`,
  section: 'admin',
  title: 'nav.servers',
  subtitle: 'servers.subtitle',
  permission: ['hosting', 'view'],
  async render(ctx) {
    const manage = ctx.can('hosting', 'manage');
    const { servers, providers } = await hosting.servers.list();
    const provider = providers.some((item) => item.id === ctx.state.provider) ? ctx.state.provider! : '';
    const state = ctx.state.state === 'on' || ctx.state.state === 'off' ? ctx.state.state : '';
    const query = gridQuery(ctx.state, ['name', 'location', 'accounts'], 'name');
    const filtered = servers.filter((server) =>
      (!provider || server.provider === provider) && (!state || server.isActive === (state === 'on')));
    const page = localGrid(filtered, query, {
      text: (server) => `${server.name} ${server.url} ${server.location ?? ''} ${server.ipv4 ?? ''}`,
      sort: { name: (server) => server.name, location: (server) => server.location, accounts: (server) => server.accounts },
    });
    const providerTitle = (id: string) => providers.find((item) => item.id === id)?.title ?? id;

    const grid = datagrid({
      ctx,
      query: page.query,
      total: page.total,
      toolbar: {
        segments: {
          name: 'state',
          value: state,
          items: [
            { label: ctx.t('statusAll'), value: '', count: servers.length },
            { label: ctx.t('on'), value: 'on', count: servers.filter((server) => server.isActive).length },
            { label: ctx.t('off'), value: 'off', count: servers.filter((server) => !server.isActive).length },
          ],
        },
        filters: [{ name: 'provider', label: ctx.t('provider'), value: provider, options: [{ value: '', label: ctx.t('allProviders') }, ...providers.map((item) => ({ value: item.id, label: item.title }))] }],
        search: searchBox(ctx, query),
      },
      columns: [
        { key: 'name', label: ctx.t('server'), sortable: true },
        { key: 'provider', label: ctx.t('provider') },
        { key: 'location', label: ctx.t('col.location'), sortable: true },
        { key: 'accounts', label: ctx.t('accounts'), width: '160px', sortable: true },
        { key: 'status', label: ctx.t('status') },
        { key: 'actions', label: '', align: 'right', width: '1%' },
      ],
      rows: page.rows.map((server) => {
        const url = `${ADMIN}/servers/${server.id}`;
        const fill = usagePercent(server.accounts, server.maxAccounts);
        return {
          key: server.id,
          tone: server.isActive ? undefined : 'muted' as const,
          cells: {
            name: [{ type: 'link', text: server.name, href: url }, ui.muted(server.url)],
            provider: [badge(providerTitle(server.provider), server.provider === 'sandbox' ? 'purple' : 'blue'), ...(server.verifyTls ? [] : [badge(ctx.t('tlsOff'), 'orange')])],
            location: [ui.row([{ type: 'flag', code: server.location }, ui.text(countryName(server.location, ctx.lang), { size: 'sm' })]), ...(server.ipv4 ? [ui.muted(server.ipv4)] : [])],
            accounts: server.maxAccounts
              ? [{ type: 'progress', value: fill, tone: usageTone(fill), label: `${server.accounts} / ${server.maxAccounts}` }]
              : [ui.text(String(server.accounts))],
            status: [onOff(ctx, server.isActive), ...(server.isActive && !server.isPublic ? [badge(ctx.t('private'))] : [])],
            actions: [{
              type: 'actions',
              items: [
                { type: 'button', label: ctx.t('openConsole'), icon: 'arrow', href: url },
                ...(manage ? [
                  { type: 'button' as const, label: ctx.t('check'), icon: 'refresh', action: { method: 'POST' as const, url: `${url}/check`, success: { notice: ctx.t('checkOk', { server: server.name, accounts: '{accounts}', packages: '{packages}' }), errorKey: 'error', reload: false } } },
                  { type: 'button' as const, label: server.isActive ? ctx.t('disable') : ctx.t('enable'), icon: server.isActive ? 'lock' : 'check', action: { method: 'PATCH' as const, url, body: { isActive: !server.isActive } } },
                  ...(server.accounts === 0 ? [{ type: 'button' as const, label: ctx.t('delete'), icon: 'trash', variant: 'danger' as const, action: { method: 'DELETE' as const, url, confirm: ctx.t('deleteServerConfirm', { server: server.name }) } }] : []),
                ] : []),
              ],
            }],
          },
        };
      }),
      empty: ctx.t('noServers'),
    });

    return {
      nodes: [grid],
      actions: manage ? [{ type: 'button', label: ctx.t('addServer'), icon: 'plus', dialog: { title: ctx.t('addServer'), nodes: [serverForm(ctx, providers)] } }] : [],
    };
  },
};
