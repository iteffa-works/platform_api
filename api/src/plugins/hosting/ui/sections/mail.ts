/** Пошта: поштові домени й скриньки (квоти, переадресація, новий пароль) */
import { ui, type UiNode } from '../../../../core/ui/index.js';
import { hosting } from '../../module.js';
import { formatSize } from '../format.js';
import { action, badge, dialogButton, enc, menu, panel, passwordField, removeAction, secretResult, table, usagePercent, usageTone } from '../kit.js';
import type { PanelSectionRenderer } from './scope.js';

export const mailSection: PanelSectionRenderer = async (scope) => {
  const { t } = scope;
  const [domains, boxes] = await Promise.all([
    hosting.panel.mailDomains(scope.serverId, scope.owner),
    hosting.panel.mailboxes(scope.serverId, scope.owner),
  ]);

  const domainActions: UiNode[] = scope.manage ? [dialogButton(t('newMailDomain'), t('newMailDomain'), [{
    type: 'form',
    layout: 'stack',
    fields: [await scope.ownerFieldWithOptions(), { name: 'name', kind: 'text', label: t('domain'), required: true, placeholder: 'example.com', autocomplete: 'off', hint: t('mailDomainHint') }],
    submit: { label: t('create'), action: { method: 'POST', url: `${scope.api}/mail/domains`, success: { notice: t('saved') } } },
  }])] : [];

  const boxActions: UiNode[] = scope.manage && domains.length ? [dialogButton(t('newMailbox'), t('newMailbox'), [{
    type: 'form',
    layout: 'stack',
    fields: [
      await scope.ownerFieldWithOptions(scope.owner ?? domains[0]?.owner),
      { name: 'name', kind: 'text', label: t('mailboxName'), required: true, placeholder: 'info', autocomplete: 'off' },
      { name: 'domain', kind: 'select', label: t('domain'), required: true, options: domains.map((domain) => ({ value: domain.name, label: `@${domain.name}` })) },
      passwordField(scope.ctx),
      { name: 'quotaMb', kind: 'number', label: t('quotaMb'), hint: t('quotaHint') },
    ],
    submit: { label: t('create'), action: { method: 'POST', url: `${scope.api}/mail/boxes`, success: { notice: t('created', { login: '{address}' }), result: secretResult(scope.ctx) } } },
  }])] : [];

  return [
    ...(await scope.ownerFilter()),
    panel(`${t('mailDomains')} · ${domains.length}`, [table(
      scope.columns([
        { key: 'name', label: t('domain') },
        { key: 'owner', label: t('owner') },
        { key: 'state', label: t('status') },
        { key: 'actions', label: '', align: 'right', width: '48px' },
      ]),
      domains.map((domain) => ({
        key: domain.name,
        cells: {
          name: [ui.text({ b: domain.name })],
          owner: [ui.text(domain.owner, { size: 'sm' })],
          state: [ui.row([badge(domain.active ? t('on') : t('off'), domain.active ? 'green' : 'slate'), ...(domain.dkim ? [badge('DKIM', 'blue')] : [])])],
          actions: scope.manage ? [menu([removeAction(t('delete'), `${scope.api}/mail/domains/${enc(domain.name)}?owner=${enc(domain.owner)}`, t('deleteMailDomainConfirm', { name: domain.name }))])] : [],
        },
      })),
      scope.fixed ? t('noMailYet') : t('empty'),
    )], { flush: true, actions: domainActions }),
    panel(`${t('mailboxes')} · ${boxes.length}`, [table(
      scope.columns([
        { key: 'address', label: t('mailbox') },
        { key: 'owner', label: t('owner') },
        { key: 'size', label: t('quota'), width: '180px' },
        { key: 'forward', label: t('forward') },
        { key: 'actions', label: '', align: 'right', width: '48px' },
      ]),
      boxes.map((box) => {
        const url = `${scope.api}/mail/boxes/${enc(box.address)}`;
        const percent = usagePercent(box.usedMb, box.quotaMb);
        return {
          key: box.address,
          muted: !box.active,
          cells: {
            address: [ui.text({ b: box.address }), ...(box.note ? [ui.muted(box.note)] : [])],
            owner: [ui.text(box.owner, { size: 'sm' })],
            size: [{ type: 'progress', value: percent, tone: usageTone(percent), label: `${formatSize(box.usedMb)} / ${box.quotaMb ? formatSize(box.quotaMb) : '∞'}` }],
            forward: [ui.muted(box.forward ?? '—')],
            actions: scope.manage ? [menu([
              action(t('resetPassword'), { method: 'POST', url: `${url}/password?owner=${enc(box.owner)}`, confirm: t('resetPasswordConfirm', { login: box.address }), success: { result: secretResult(scope.ctx), reload: false } }),
              removeAction(t('delete'), `${url}?owner=${enc(box.owner)}`, t('deleteMailboxConfirm', { name: box.address })),
            ])] : [],
          },
        };
      }),
      domains.length ? t('empty') : t('mailNeedDomain'),
      t('search'),
    )], { flush: true, actions: boxActions }),
  ];
};
