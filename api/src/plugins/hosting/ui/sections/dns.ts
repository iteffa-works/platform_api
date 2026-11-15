/** DNS: зони й записи (`?zone=` — записи зони) */
import { ui, type UiNode } from '../../../../core/ui/index.js';
import { DNS_TYPES } from '../../domain/rules.js';
import { hosting } from '../../module.js';
import { badge, code, dialogButton, enc, menu, panel, removeAction, table } from '../kit.js';
import type { PanelSectionRenderer } from './scope.js';

export const dnsSection: PanelSectionRenderer = async (scope) => {
  const { t } = scope;
  const zoneName = scope.ctx.state.zone;
  const zones = await hosting.panel.zones(scope.serverId, scope.owner);
  const zoneHref = (name?: string) => scope.href({ tab: 'dns', zone: name });

  const actions: UiNode[] = scope.manage ? [dialogButton(t('newZone'), t('newZone'), [{
    type: 'form',
    layout: 'stack',
    fields: [
      await scope.ownerFieldWithOptions(),
      { name: 'name', kind: 'text', label: t('domain'), required: true, placeholder: 'example.com', autocomplete: 'off' },
      ...(scope.fixed ? [] : [{ name: 'ip', kind: 'text' as const, label: t('zoneIp'), hint: t('zoneIpHint') }]),
    ],
    submit: { label: t('create'), action: { method: 'POST', url: `${scope.api}/dns`, success: { notice: t('saved') } } },
  }])] : [];

  const nodes: UiNode[] = [...(await scope.ownerFilter()), panel(`${t('zones')} · ${zones.length}`, [table(
    scope.columns([
      { key: 'name', label: t('domain') },
      { key: 'owner', label: t('owner') },
      { key: 'type', label: t('type') },
      { key: 'dnssec', label: 'DNSSEC' },
      { key: 'actions', label: '', align: 'right', width: '48px' },
    ]),
    zones.map((zone) => ({
      key: zone.name,
      cells: {
        name: [{ type: 'link', text: zone.name, href: zoneHref(zone.name) }],
        owner: [ui.text(zone.owner, { size: 'sm' })],
        type: [ui.muted(zone.type)],
        dnssec: [zone.dnssec ? badge(zone.dnssec, zone.dnssec === 'signed' ? 'green' : 'slate') : ui.muted('—')],
        actions: [menu([
          { type: 'button', variant: 'ghost', label: t('records'), href: zoneHref(zone.name) },
          scope.manage && removeAction(t('delete'), `${scope.api}/dns/${enc(zone.name)}?owner=${enc(zone.owner)}`, t('deleteZoneConfirm', { name: zone.name })),
        ])],
      },
    })),
    scope.fixed ? t('noZonesYet') : t('empty'),
    t('search'),
  )], { flush: true, actions })];

  if (zoneName && zones.some((zone) => zone.name === zoneName)) {
    const records = await hosting.panel.records(scope.serverId, zoneName, scope.fixed ? scope.owner : undefined);
    const recordsUrl = `${scope.api}/dns/${enc(zoneName)}/records`;
    const recordActions: UiNode[] = scope.manage ? [dialogButton(t('newRecord'), `${t('newRecord')} · ${zoneName}`, [{
      type: 'form',
      layout: 'stack',
      fields: [
        { name: 'type', kind: 'select', label: t('type'), value: 'A', options: DNS_TYPES.map((type) => ({ value: type, label: type })) },
        { name: 'name', kind: 'text', label: t('recordName'), required: true, placeholder: `www / @ / mail.${zoneName}.`, hint: t('recordNameHint') },
        { name: 'value', kind: 'text', label: t('recordValue'), required: true },
        { name: 'ttl', kind: 'number', label: 'TTL', value: '3600' },
        { name: 'priority', kind: 'number', label: t('priority'), hint: t('priorityHint') },
      ],
      submit: { label: t('create'), action: { method: 'POST', url: recordsUrl, success: { notice: t('saved') } } },
    }])] : [];
    nodes.push(panel(`${t('records')} · ${zoneName}`, [table(
      [
        { key: 'name', label: t('recordName') },
        { key: 'type', label: t('type'), width: '90px' },
        { key: 'value', label: t('recordValue') },
        { key: 'ttl', label: 'TTL', align: 'right', width: '80px' },
        { key: 'actions', label: '', align: 'right', width: '48px' },
      ],
      records.map((record) => ({
        key: record.key,
        cells: {
          name: [ui.text(record.name, { size: 'sm' })],
          type: [badge(record.type, 'blue')],
          value: [code(record.value)],
          ttl: [ui.muted(String(record.ttl ?? '—'))],
          actions: scope.manage && record.type !== 'SOA' ? [menu([removeAction(t('delete'), recordsUrl, t('deleteRecordConfirm', { name: record.name, type: record.type }), { record: record.key })])] : [],
        },
      })),
      t('empty'),
      t('search'),
    )], { flush: true, actions: [...recordActions, { type: 'button', variant: 'ghost', label: t('close'), href: zoneHref() }] }));
  }
  return nodes;
};
