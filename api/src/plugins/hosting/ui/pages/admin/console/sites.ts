/** WWW-домени: створення, перегляд PHP / SSL / IP, видалення */
import { ui, type UiNode } from '../../../../../../core/ui/index.js';
import { hosting } from '../../../../module.js';
import { badge, dialogButton, enc, menu, ownerField, ownerFilter, panel, removeAction, table } from '../../../kit.js';
import type { ConsoleSection } from './context.js';

export const sitesSection: ConsoleSection = async (console) => {
  const { t } = console;
  const [sites, owners] = await Promise.all([hosting.panel.sites(console.server.id, console.owner), console.owners()]);

  const actions: UiNode[] = console.manage ? [dialogButton(t('newSite'), t('newSite'), [{
    type: 'form',
    layout: 'stack',
    fields: [
      ownerField(console.ctx, owners, console.owner),
      { name: 'name', kind: 'text', label: t('domain'), required: true, placeholder: 'example.com', autocomplete: 'off', hint: t('siteHint') },
    ],
    submit: { label: t('create'), action: { method: 'POST', url: `${console.api}/sites`, success: { notice: t('saved') } } },
  }])] : [];

  return [
    ownerFilter(console.ctx, owners, console.owner),
    panel(`${t('tab.sites')} · ${sites.length}`, [table(
      [
        { key: 'name', label: t('domain') },
        { key: 'owner', label: t('owner') },
        { key: 'php', label: 'PHP' },
        { key: 'ips', label: t('ipAddresses') },
        { key: 'state', label: t('status') },
        { key: 'actions', label: '', align: 'right', width: '48px' },
      ],
      sites.map((site) => ({
        key: site.name,
        muted: !site.active,
        cells: {
          name: [{ type: 'link', text: site.name, href: `${site.ssl ? 'https' : 'http'}://${site.name}`, external: true }, ...(site.docroot ? [ui.muted(site.docroot)] : [])],
          owner: [ui.text(site.owner, { size: 'sm' })],
          php: [ui.text(site.php ?? '—', { size: 'sm' })],
          ips: [ui.muted(site.ips.join(', ') || '—')],
          state: [ui.row([badge(site.active ? t('on') : t('off'), site.active ? 'green' : 'slate'), ...(site.ssl ? [badge('SSL', 'blue')] : [])])],
          actions: console.manage ? [menu([
            removeAction(t('delete'), `${console.api}/sites/${enc(site.name)}?owner=${enc(site.owner)}`, t('deleteSiteConfirm', { name: site.name })),
          ])] : [],
        },
      })),
      t('empty'),
      t('search'),
    )], { flush: true, actions }),
  ];
};
