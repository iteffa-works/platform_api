/** WWW-домени: створення, PHP / SSL / IP, видалення */
import { ui, type UiNode } from '../../../../flowaxy/ui/index.js';
import { hosting } from '../../module.js';
import { badge, dialogButton, enc, panel } from '../kit.js';
import type { PanelSectionRenderer } from './scope.js';

export const sitesSection: PanelSectionRenderer = async (scope) => {
  const { t } = scope;
  const sites = await hosting.resources.list(scope.account, 'site');

  const actions: UiNode[] = scope.manage ? [dialogButton(t('newSite'), t('newSite'), [{
    type: 'form',
    layout: 'stack',
    fields: [
      { name: 'name', kind: 'text', label: t('domain'), required: true, placeholder: 'example.com', autocomplete: 'off', hint: t('siteHint') },
    ],
    submit: { label: t('create'), action: { method: 'POST', url: `${scope.api}/sites`, success: { notice: t('saved') } } },
  }])] : [];

  const grid = await scope.grid(sites, {
    defaultSort: 'name',
    sort: { name: (site) => site.name, php: (site) => site.php },
    text: (site) => `${site.name} ${site.docroot ?? ''} ${site.ips.join(' ')}`,
    columns: [
      { key: 'name', label: t('domain') },
      { key: 'php', label: 'PHP' },
      { key: 'ips', label: t('ipAddresses') },
      { key: 'state', label: t('status') },
      { key: 'actions', label: '', align: 'right', width: '1%' },
    ],
    row: (site) => ({
      key: site.name,
      tone: site.active ? undefined : 'muted',
      cells: {
        name: [{ type: 'link', text: site.name, href: `${site.ssl ? 'https' : 'http'}://${site.name}`, external: true }, ...(site.docroot ? [ui.muted(site.docroot)] : [])],
        php: [ui.text(site.php ?? '—', { size: 'sm' })],
        ips: [ui.muted(site.ips.join(', ') || '—')],
        state: [ui.row([badge(site.active ? t('on') : t('off'), site.active ? 'green' : 'slate'), ...(site.ssl ? [badge('SSL', 'blue')] : [])])],
        actions: [{
          type: 'actions',
          items: [
            { type: 'button', label: t('openSite'), icon: 'external', href: `${site.ssl ? 'https' : 'http'}://${site.name}` },
            ...(scope.manage ? [{ type: 'button' as const, label: t('delete'), icon: 'trash', variant: 'danger' as const, action: { method: 'DELETE' as const, url: `${scope.api}/sites/${enc(site.name)}`, confirm: t('deleteSiteConfirm', { name: site.name }) } }] : []),
          ],
        }],
      },
    }),
    empty: t('noSitesYet'),
  });

  return [panel(`${t('tab.sites')} · ${sites.length}`, [grid], { flush: true, actions })];
};
