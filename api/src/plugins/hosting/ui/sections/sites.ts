/** WWW-домени: створення, PHP / SSL / IP, видалення */
import { ui, type UiNode } from '../../../../core/ui/index.js';
import { hosting } from '../../module.js';
import { badge, dialogButton, enc, menu, panel, removeAction, table } from '../kit.js';
import type { PanelSectionRenderer } from './scope.js';

export const sitesSection: PanelSectionRenderer = async (scope) => {
  const { t } = scope;
  const sites = await hosting.panel.sites(scope.serverId, scope.owner);

  const actions: UiNode[] = scope.manage ? [dialogButton(t('newSite'), t('newSite'), [{
    type: 'form',
    layout: 'stack',
    fields: [
      await scope.ownerFieldWithOptions(),
      { name: 'name', kind: 'text', label: t('domain'), required: true, placeholder: 'example.com', autocomplete: 'off', hint: t('siteHint') },
    ],
    submit: { label: t('create'), action: { method: 'POST', url: `${scope.api}/sites`, success: { notice: t('saved') } } },
  }])] : [];

  return [
    ...(await scope.ownerFilter()),
    panel(`${t('tab.sites')} · ${sites.length}`, [table(
      scope.columns([
        { key: 'name', label: t('domain') },
        { key: 'owner', label: t('owner') },
        { key: 'php', label: 'PHP' },
        { key: 'ips', label: t('ipAddresses') },
        { key: 'state', label: t('status') },
        { key: 'actions', label: '', align: 'right', width: '48px' },
      ]),
      sites.map((site) => ({
        key: site.name,
        muted: !site.active,
        cells: {
          name: [{ type: 'link', text: site.name, href: `${site.ssl ? 'https' : 'http'}://${site.name}`, external: true }, ...(site.docroot ? [ui.muted(site.docroot)] : [])],
          owner: [ui.text(site.owner, { size: 'sm' })],
          php: [ui.text(site.php ?? '—', { size: 'sm' })],
          ips: [ui.muted(site.ips.join(', ') || '—')],
          state: [ui.row([badge(site.active ? t('on') : t('off'), site.active ? 'green' : 'slate'), ...(site.ssl ? [badge('SSL', 'blue')] : [])])],
          actions: scope.manage ? [menu([
            removeAction(t('delete'), `${scope.api}/sites/${enc(site.name)}?owner=${enc(site.owner)}`, t('deleteSiteConfirm', { name: site.name })),
          ])] : [],
        },
      })),
      scope.fixed ? t('noSitesYet') : t('empty'),
      t('search'),
    )], { flush: true, actions }),
  ];
};
