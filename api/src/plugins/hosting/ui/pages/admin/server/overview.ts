/** Огляд сервера: стан синхронізації, навантаження й ресурси (з копії), система панелі, служби, IP */
import { ui, type UiNode } from '../../../../../../flowaxy/ui/index.js';
import { CLIENT_KINDS } from '../../../../domain/models.js';
import { hosting } from '../../../../module.js';
import { datagrid } from '../../../grid.js';
import { ADMIN, badge, errorBanner, panel } from '../../../kit.js';
import { percent } from '../../../format.js';
import type { ServerTab } from './context.js';

export const overviewTab: ServerTab = async (page) => {
  const { t, server, ctx } = page;
  const counts = await hosting.mirror.counts(server.id);
  const nodes: UiNode[] = [];

  if (!server.isActive) nodes.push({ type: 'alert', tone: 'warn', text: t('serverDisabled') });
  else if (server.syncError) nodes.push({ type: 'alert', tone: 'danger', text: [{ b: `${t('syncFailed')}: ` }, server.syncError] });

  nodes.push({
    type: 'stats',
    items: [
      {
        label: t('accounts'),
        value: server.maxAccounts ? `${server.accounts} / ${server.maxAccounts}` : String(server.accounts),
        progress: percent(server.accounts, server.maxAccounts),
        icon: 'users',
        tone: 'blue',
        href: `${ADMIN}/accounts?server=${server.id}`,
      },
      { label: t('stat.panelUsers'), value: String(counts.user ?? 0), hint: t('stat.linked', { count: server.accounts }), icon: 'server', tone: 'purple', href: `${page.page}?tab=users` },
      { label: t('kind.site'), value: String(counts.site ?? 0), icon: 'apps', tone: 'slate' },
      {
        label: t('syncState'),
        value: server.syncedAt ? { type: 'datetime', value: new Date(server.syncedAt).toISOString() } : t('syncNever'),
        hint: t('syncHint', { minutes: hosting.config.jobIntervalMinutes }),
        icon: 'refresh',
        tone: server.syncError ? 'orange' : 'green',
      },
    ],
  });

  // Ресурси клієнтів — лише кількості з копії (керують ними клієнти в кабінеті)
  const resources = panel(t('resources'), [{
    type: 'fields',
    items: CLIENT_KINDS.map((kind) => ({ label: t(`kind.${kind}`), value: String(counts[kind] ?? 0) })),
  }], { subtitle: t('resourcesHint') });

  const network = panel(t('serverIps'), [{
    type: 'fields',
    items: [
      { label: 'IPv4', value: server.ipv4 ?? '—' },
      { label: 'IPv6', value: server.ipv6 ?? '—' },
    ],
  }], { subtitle: t('serverIpsHint') });

  if (!server.isActive) {
    nodes.push({ type: 'grid', min: 360, children: [resources, network] });
    return nodes;
  }

  // Система панелі — живий запит через кеш; частини незалежні; немає підключення — копія все одно видна
  let overview: Awaited<ReturnType<typeof hosting.servers.overview>>;
  try {
    overview = await hosting.servers.overview(server.id);
  } catch (error) {
    nodes.push(errorBanner(ctx, error), { type: 'grid', min: 360, children: [resources, network] });
    return nodes;
  }
  const info = overview.info;
  const system = panel(t('system'), info.ok
    ? [{
      type: 'fields',
      items: [
        { label: t('panelName'), value: info.value.panel },
        { label: t('version'), value: info.value.version ?? '—' },
        { label: t('os'), value: info.value.os ?? '—' },
        ...(info.value.license ? [
          { label: t('license'), value: [info.value.license.name ?? '—', info.value.license.id ? ` · #${info.value.license.id}` : ''] },
          { label: t('licenseUntil'), value: info.value.license.expires ? ui.date(info.value.license.expires) : '—' },
        ] : []),
        ...info.value.hardware.map((item) => ({ label: item.name, value: item.value })),
      ],
    }]
    : [errorBanner(ctx, info.error)]);

  // Служби: зупинені — першими
  const services = overview.services.ok ? overview.services.value : [];
  const servicesPanel = panel(t('services'), overview.services.ok
    ? [datagrid({
      ctx,
      paged: false,
      columns: [{ key: 'name', label: t('service') }, { key: 'state', label: t('status') }, { key: 'auto', label: t('autostart') }],
      rows: [...services].sort((a, b) => Number(a.running) - Number(b.running) || a.name.localeCompare(b.name)).map((service) => ({
        key: service.name,
        tone: service.running ? undefined : 'danger' as const,
        cells: {
          name: [ui.text({ b: service.name })],
          state: [badge(service.running ? t('running') : t('stopped'), service.running ? 'green' : 'red')],
          auto: [ui.muted(service.autostart ? t('yes') : t('no'))],
        },
      })),
      empty: t('empty'),
    })]
    : [errorBanner(ctx, overview.services.error)], { flush: overview.services.ok, subtitle: overview.services.ok ? `${services.filter((service) => service.running).length} / ${services.length}` : undefined });

  const php = panel(t('phpVersions'), overview.php.ok
    ? [ui.row(overview.php.value.map((item) => badge(item.name, item.installed ? 'green' : 'slate')))]
    : [errorBanner(ctx, overview.php.error)]);

  nodes.push({ type: 'grid', min: 360, children: [ui.stack([system, resources], 16), ui.stack([network, php, servicesPanel], 16)] });
  return nodes;
};
