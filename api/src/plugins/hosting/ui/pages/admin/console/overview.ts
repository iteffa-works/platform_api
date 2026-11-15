/** Огляд сервера: показники, система й ліцензія, залізо, служби, IP, PHP */
import { ui, type UiNode } from '../../../../../../core/ui/index.js';
import { hosting } from '../../../../module.js';
import { formatSize } from '../../../format.js';
import { badge, errorBanner, panel, table } from '../../../kit.js';
import type { ConsoleSection } from './context.js';

export const overviewSection: ConsoleSection = async (console) => {
  const { t } = console;
  const [overview, users, sites] = await Promise.all([
    hosting.panel.overview(console.server.id),
    hosting.servers.panelAccounts(console.server.id).then((data) => data.accounts).catch(() => null),
    hosting.panel.sites(console.server.id).catch(() => null),
  ]);
  const services = overview.services.ok ? overview.services.value : [];
  const running = services.filter((service) => service.running).length;
  const diskUsed = (users ?? []).reduce((sum, user) => sum + (user.diskUsedMb ?? 0), 0);

  const nodes: UiNode[] = [{
    type: 'stats',
    items: [
      { label: t('stat.panelUsers'), value: users ? String(users.length) : '—', hint: users ? t('stat.linked', { count: users.filter((user) => user.linked).length }) : undefined, icon: 'users', tone: 'blue', href: `${console.page}?tab=users` },
      { label: t('stat.sites'), value: sites ? String(sites.length) : '—', icon: 'apps', tone: 'purple', href: `${console.page}?tab=sites` },
      { label: t('stat.services'), value: overview.services.ok ? `${running} / ${services.length}` : '—', icon: 'settings', tone: running === services.length ? 'green' : 'orange' },
      { label: t('stat.disk'), value: users ? formatSize(diskUsed) : '—', hint: t('stat.diskHint'), icon: 'layers', tone: 'slate' },
    ],
  }];

  const info = overview.info;
  const system = info.ok
    ? panel(t('system'), [{
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
    }])
    : panel(t('system'), [errorBanner(console.ctx, info.error)]);

  const servicesPanel = panel(t('services'), overview.services.ok
    ? [table(
      [{ key: 'name', label: t('service') }, { key: 'state', label: t('status') }, { key: 'auto', label: t('autostart') }],
      services.map((service) => ({
        key: service.name,
        cells: {
          name: [ui.text({ b: service.name })],
          state: [badge(service.running ? t('running') : t('stopped'), service.running ? 'green' : 'red')],
          auto: [ui.muted(service.autostart ? t('yes') : t('no'))],
        },
      })),
      t('empty'),
    )]
    : [errorBanner(console.ctx, overview.services.error)], { flush: overview.services.ok });

  const network = panel(t('network'), [
    ui.text({ b: t('ipAddresses') }),
    ...(overview.ips.ok ? [ui.row(overview.ips.value.map((ip) => ({ type: 'code', text: ip }) as UiNode))] : [errorBanner(console.ctx, overview.ips.error)]),
    ui.text({ b: t('phpVersions') }),
    ...(overview.php.ok ? [ui.row(overview.php.value.map((php) => badge(php.name, php.installed ? 'green' : 'slate')))] : [errorBanner(console.ctx, overview.php.error)]),
  ]);

  nodes.push({ type: 'grid', min: 360, children: [system, ui.stack([network, servicesPanel], 16)] });
  return nodes;
};
