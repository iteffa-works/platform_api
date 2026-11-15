/** DNS: зони; обрана зона (`?zone=`) — її записи (замість списку зон) */
import { ui, type UiNode } from '../../../../core/ui/index.js';
import { DNS_TYPES } from '../../domain/rules.js';
import { hosting } from '../../module.js';
import { badge, code, dialogButton, enc, panel } from '../kit.js';
import type { PanelScope, PanelSectionRenderer } from './scope.js';

async function recordsView(scope: PanelScope, zoneName: string): Promise<UiNode[]> {
  const { t } = scope;
  const records = await hosting.panel.records(scope.serverId, zoneName, scope.fixed ? scope.owner : undefined);
  const recordsUrl = `${scope.api}/dns/${enc(zoneName)}/records`;
  const types = [...new Set(records.map((record) => record.type))].sort();
  const type = types.includes(scope.ctx.state.type ?? '') ? scope.ctx.state.type! : '';
  const visible = type ? records.filter((record) => record.type === type) : records;

  const actions: UiNode[] = [
    { type: 'button', variant: 'ghost', label: `← ${t('zones')}`, href: scope.href({ tab: 'dns' }) },
    ...(scope.manage ? [dialogButton(t('newRecord'), `${t('newRecord')} · ${zoneName}`, [{
      type: 'form',
      layout: 'stack',
      fields: [
        { name: 'type', kind: 'select', label: t('type'), value: 'A', options: DNS_TYPES.map((item) => ({ value: item, label: item })) },
        { name: 'name', kind: 'text', label: t('recordName'), required: true, placeholder: `www / @ / mail.${zoneName}.`, hint: t('recordNameHint') },
        { name: 'value', kind: 'text', label: t('recordValue'), required: true },
        { name: 'ttl', kind: 'number', label: 'TTL', value: '3600' },
        { name: 'priority', kind: 'number', label: t('priority'), hint: t('priorityHint') },
      ],
      submit: { label: t('create'), action: { method: 'POST', url: recordsUrl, success: { notice: t('saved') } } },
    }])] : []),
  ];

  const grid = await scope.grid(visible, {
    defaultSort: 'type',
    sort: { name: (record) => record.name, type: (record) => record.type, ttl: (record) => record.ttl },
    text: (record) => `${record.name} ${record.type} ${record.value}`,
    segments: {
      name: 'type',
      value: type,
      items: [{ label: t('statusAll'), value: '', count: records.length }, ...types.map((item) => ({ label: item, value: item, count: records.filter((record) => record.type === item).length }))],
    },
    columns: [
      { key: 'name', label: t('recordName') },
      { key: 'type', label: t('type'), width: '90px' },
      { key: 'value', label: t('recordValue') },
      { key: 'ttl', label: 'TTL', align: 'right', width: '80px' },
      { key: 'actions', label: '', align: 'right', width: '1%' },
    ],
    row: (record) => ({
      key: record.key,
      cells: {
        name: [ui.text(record.name, { size: 'sm' })],
        type: [badge(record.type, 'blue')],
        value: [code(record.value)],
        ttl: [ui.muted(String(record.ttl ?? '—'))],
        actions: [{
          type: 'actions',
          items: scope.manage && record.type !== 'SOA'
            ? [{ type: 'button', label: t('delete'), icon: 'trash', variant: 'danger', action: { method: 'DELETE', url: recordsUrl, body: { record: record.key }, confirm: t('deleteRecordConfirm', { name: record.name, type: record.type }) } }]
            : [],
        }],
      },
    }),
    empty: t('empty'),
  });
  return [panel(`${t('records')} · ${zoneName}`, [grid], { flush: true, actions })];
}

export const dnsSection: PanelSectionRenderer = async (scope) => {
  const { t } = scope;
  const zoneName = scope.ctx.state.zone;
  const zones = await hosting.panel.zones(scope.serverId, scope.owner);
  if (zoneName && zones.some((zone) => zone.name === zoneName)) return recordsView(scope, zoneName);

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

  const grid = await scope.grid(zones, {
    defaultSort: 'name',
    sort: { name: (zone) => zone.name, owner: (zone) => zone.owner },
    text: (zone) => `${zone.name} ${zone.owner}`,
    columns: [
      { key: 'name', label: t('domain') },
      { key: 'owner', label: t('owner') },
      { key: 'type', label: t('type') },
      { key: 'dnssec', label: 'DNSSEC' },
      { key: 'actions', label: '', align: 'right', width: '1%' },
    ],
    row: (zone) => ({
      key: zone.name,
      cells: {
        name: [{ type: 'link', text: zone.name, href: scope.href({ tab: 'dns', zone: zone.name }) }],
        owner: [ui.text(zone.owner, { size: 'sm' })],
        type: [ui.muted(zone.type)],
        dnssec: [zone.dnssec ? badge(zone.dnssec, zone.dnssec === 'signed' ? 'green' : 'slate') : ui.muted('—')],
        actions: [{
          type: 'actions',
          items: [
            { type: 'button', label: t('records'), icon: 'list', href: scope.href({ tab: 'dns', zone: zone.name }) },
            ...(scope.manage ? [{ type: 'button' as const, label: t('delete'), icon: 'trash', variant: 'danger' as const, action: { method: 'DELETE' as const, url: `${scope.api}/dns/${enc(zone.name)}?owner=${enc(zone.owner)}`, confirm: t('deleteZoneConfirm', { name: zone.name }) } }] : []),
          ],
        }],
      },
    }),
    empty: scope.fixed ? t('noZonesYet') : t('empty'),
  });
  return [panel(`${t('zones')} · ${zones.length}`, [grid], { flush: true, actions })];
};
