/** Пошта: поштові домени й скриньки (квоти, переадресація, скидання пароля) */
import { ui, type UiNode } from '../../../../../../core/ui/index.js';
import { hosting } from '../../../../module.js';
import { formatSize } from '../../../format.js';
import { action, badge, dialogButton, enc, menu, ownerField, ownerFilter, panel, passwordField, removeAction, secretResult, table, usagePercent, usageTone } from '../../../kit.js';
import type { ConsoleSection } from './context.js';

export const mailSection: ConsoleSection = async (console) => {
  const { t } = console;
  const [domains, boxes, owners] = await Promise.all([
    hosting.panel.mailDomains(console.server.id, console.owner),
    hosting.panel.mailboxes(console.server.id, console.owner),
    console.owners(),
  ]);

  const domainActions: UiNode[] = console.manage ? [dialogButton(t('newMailDomain'), t('newMailDomain'), [{
    type: 'form',
    layout: 'stack',
    fields: [ownerField(console.ctx, owners, console.owner), { name: 'name', kind: 'text', label: t('domain'), required: true, placeholder: 'example.com', autocomplete: 'off' }],
    submit: { label: t('create'), action: { method: 'POST', url: `${console.api}/mail/domains`, success: { notice: t('saved') } } },
  }])] : [];

  const boxActions: UiNode[] = console.manage && domains.length ? [dialogButton(t('newMailbox'), t('newMailbox'), [{
    type: 'form',
    layout: 'stack',
    fields: [
      ownerField(console.ctx, owners, console.owner ?? domains[0]?.owner),
      { name: 'name', kind: 'text', label: t('mailboxName'), required: true, placeholder: 'info', autocomplete: 'off' },
      { name: 'domain', kind: 'select', label: t('domain'), required: true, options: domains.map((domain) => ({ value: domain.name, label: domain.name })) },
      passwordField(console.ctx),
      { name: 'quotaMb', kind: 'number', label: t('quotaMb'), hint: t('quotaHint') },
    ],
    submit: { label: t('create'), action: { method: 'POST', url: `${console.api}/mail/boxes`, success: { notice: t('created', { login: '{address}' }), result: secretResult(console.ctx) } } },
  }])] : [];

  return [
    ownerFilter(console.ctx, owners, console.owner),
    panel(`${t('mailDomains')} · ${domains.length}`, [table(
      [
        { key: 'name', label: t('domain') },
        { key: 'owner', label: t('owner') },
        { key: 'state', label: t('status') },
        { key: 'actions', label: '', align: 'right', width: '48px' },
      ],
      domains.map((domain) => ({
        key: domain.name,
        cells: {
          name: [ui.text({ b: domain.name })],
          owner: [ui.text(domain.owner, { size: 'sm' })],
          state: [ui.row([badge(domain.active ? t('on') : t('off'), domain.active ? 'green' : 'slate'), ...(domain.dkim ? [badge('DKIM', 'blue')] : [])])],
          actions: console.manage ? [menu([removeAction(t('delete'), `${console.api}/mail/domains/${enc(domain.name)}?owner=${enc(domain.owner)}`, t('deleteMailDomainConfirm', { name: domain.name }))])] : [],
        },
      })),
      t('empty'),
    )], { flush: true, actions: domainActions }),
    panel(`${t('mailboxes')} · ${boxes.length}`, [table(
      [
        { key: 'address', label: t('mailbox') },
        { key: 'owner', label: t('owner') },
        { key: 'size', label: t('quota'), width: '180px' },
        { key: 'forward', label: t('forward') },
        { key: 'actions', label: '', align: 'right', width: '48px' },
      ],
      boxes.map((box) => {
        const url = `${console.api}/mail/boxes/${enc(box.address)}`;
        const percent = usagePercent(box.usedMb, box.quotaMb);
        return {
          key: box.address,
          muted: !box.active,
          cells: {
            address: [ui.text({ b: box.address }), ...(box.note ? [ui.muted(box.note)] : [])],
            owner: [ui.text(box.owner, { size: 'sm' })],
            size: [{ type: 'progress', value: percent, tone: usageTone(percent), label: `${formatSize(box.usedMb)} / ${box.quotaMb ? formatSize(box.quotaMb) : '∞'}` }],
            forward: [ui.muted(box.forward ?? '—')],
            actions: console.manage ? [menu([
              action(t('resetPassword'), { method: 'POST', url: `${url}/password?owner=${enc(box.owner)}`, confirm: t('resetPasswordConfirm', { login: box.address }), success: { result: secretResult(console.ctx), reload: false } }),
              removeAction(t('delete'), `${url}?owner=${enc(box.owner)}`, t('deleteMailboxConfirm', { name: box.address })),
            ])] : [],
          },
        };
      }),
      t('empty'),
      t('search'),
    )], { flush: true, actions: boxActions }),
  ];
};
