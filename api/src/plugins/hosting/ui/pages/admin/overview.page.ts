/** /admin/hosting — огляд: показники, сервери, акаунти, що закінчуються (вибірка в SQL) */
import { config } from '../../../../../config/index.js';
import { ui, type UiPage } from '../../../../../core/ui/index.js';
import { hosting } from '../../../module.js';
import { money } from '../../../services/presenter.js';
import { countryName, daysLeft } from '../../format.js';
import { datagrid } from '../../grid.js';
import { ADMIN, badge, onOff, panel } from '../../kit.js';

export const overviewPage: UiPage = {
  path: ADMIN,
  section: 'admin',
  title: 'nav.overview',
  subtitle: 'overview.subtitle',
  permission: ['hosting', 'view'],
  async render(ctx) {
    const [stats, { servers, providers }, expiring] = await Promise.all([
      hosting.accounts.stats(),
      hosting.servers.list(),
      // Найближчі 10 строків: лише активні, сортування в SQL
      hosting.accounts.search({ status: 'active', sort: { key: 'paid', dir: 'asc' }, limit: 10, offset: 0 }),
    ]);
    const soon = expiring.accounts.filter((account) => {
      const days = daysLeft(account.paidUntil);
      return days !== null && days <= 7;
    });
    const providerTitle = (id: string) => providers.find((item) => item.id === id)?.title ?? id;

    const nodes = [
      {
        type: 'stats' as const,
        items: [
          { label: ctx.t('stat.active'), value: String(stats.active), icon: 'server', tone: 'green' as const, href: `${ADMIN}/accounts?status=active` },
          { label: ctx.t('stat.suspended'), value: String(stats.suspended), icon: 'lock', tone: stats.suspended ? 'orange' as const : 'slate' as const, href: `${ADMIN}/accounts?status=suspended` },
          { label: ctx.t('stat.expiring'), value: String(stats.expiring), hint: ctx.t('stat.expiringHint'), icon: 'clock', tone: stats.expiring ? 'orange' as const : 'slate' as const, href: `${ADMIN}/accounts?status=active&sort=paid` },
          { label: ctx.t('stat.revenue'), value: ui.money(money(stats.monthlyCents), config.currency), hint: ctx.t('stat.revenueHint'), icon: 'wallet', tone: 'blue' as const },
          { label: ctx.t('stat.servers'), value: `${servers.filter((server) => server.isActive).length} / ${servers.length}`, icon: 'layers', tone: 'purple' as const, href: `${ADMIN}/servers` },
        ],
      },
      {
        type: 'grid' as const,
        min: 420,
        children: [
          panel(ctx.t('servers'), [datagrid({
            ctx,
            paged: false,
            columns: [
              { key: 'name', label: ctx.t('server') },
              { key: 'location', label: ctx.t('col.location') },
              { key: 'accounts', label: ctx.t('accounts'), align: 'right' },
              { key: 'status', label: ctx.t('status') },
            ],
            rows: servers.slice(0, 10).map((server) => ({
              key: server.id,
              tone: server.isActive ? undefined : 'muted' as const,
              cells: {
                name: [{ type: 'link', text: server.name, href: `${ADMIN}/servers/${server.id}` }, ui.muted(providerTitle(server.provider))],
                location: [ui.row([{ type: 'flag', code: server.location }, ui.text(countryName(server.location, ctx.lang), { size: 'sm' })])],
                accounts: [ui.text(server.maxAccounts ? `${server.accounts} / ${server.maxAccounts}` : String(server.accounts))],
                status: [onOff(ctx, server.isActive)],
              },
            })),
            empty: ctx.t('noServers'),
          })], { flush: true, actions: [{ type: 'button', variant: 'ghost', label: ctx.t('allServers'), href: `${ADMIN}/servers` }] }),
          panel(ctx.t('expiringSoon'), [datagrid({
            ctx,
            paged: false,
            columns: [
              { key: 'login', label: ctx.t('col.name') },
              { key: 'user', label: ctx.t('user') },
              { key: 'paid', label: ctx.t('paidUntilField'), align: 'right' },
            ],
            rows: soon.map((account) => {
              const days = daysLeft(account.paidUntil)!;
              return {
                key: account.id,
                tone: days <= 3 ? 'danger' as const : 'warn' as const,
                cells: {
                  login: [ui.text({ b: account.login }), ui.muted(account.plan?.name ?? '—')],
                  user: [ui.text(account.user?.email ?? '—', { size: 'sm' })],
                  paid: [ui.text(ui.date(account.paidUntil!)), badge(days >= 0 ? ctx.t('daysLeft', { days }) : ctx.t('overdue', { days: -days }), days <= 3 ? 'red' : 'orange')],
                },
              };
            }),
            empty: ctx.t('noExpiring'),
          })], { flush: true, actions: [{ type: 'button', variant: 'ghost', label: ctx.t('allAccounts'), href: `${ADMIN}/accounts?status=active&sort=paid` }] }),
        ],
      },
    ];
    return nodes;
  },
};
