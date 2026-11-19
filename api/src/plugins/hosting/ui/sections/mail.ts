/** Пошта: поштові домени (сегменти-фільтр) і скриньки (таблиця з квотами, новий пароль, видалення) */
import { ui, type UiNode } from '../../../../flowaxy/ui/index.js';
import { hosting } from '../../module.js';
import { formatSize, percent } from '../format.js';
import { badge, dialogButton, enc, panel, passwordField, secretResult, usageTone } from '../kit.js';
import type { PanelSectionRenderer } from './scope.js';

export const mailSection: PanelSectionRenderer = async (scope) => {
  const { t } = scope;
  const [domains, boxes] = await Promise.all([
    hosting.resources.list(scope.account, 'maildomain'),
    hosting.resources.list(scope.account, 'mailbox'),
  ]);
  const domain = domains.some((item) => item.name === scope.ctx.state.domain) ? scope.ctx.state.domain! : '';
  const selected = domains.find((item) => item.name === domain);
  const visible = domain ? boxes.filter((box) => box.address.endsWith(`@${domain}`)) : boxes;

  const actions: UiNode[] = [];
  if (scope.manage) {
    actions.push(dialogButton(t('newMailDomain'), t('newMailDomain'), [{
      type: 'form',
      layout: 'stack',
      fields: [{ name: 'name', kind: 'text', label: t('domain'), required: true, placeholder: 'example.com', autocomplete: 'off', hint: t('mailDomainHint') }],
      submit: { label: t('create'), action: { method: 'POST', url: `${scope.api}/mail/domains`, success: { notice: t('saved') } } },
    }], 'plus', 'ghost'));
    if (domains.length) {
      actions.push(dialogButton(t('newMailbox'), t('newMailbox'), [{
        type: 'form',
        layout: 'stack',
        fields: [
          { name: 'name', kind: 'text', label: t('mailboxName'), required: true, placeholder: 'info', autocomplete: 'off' },
          { name: 'domain', kind: 'select', label: t('domain'), required: true, value: domain || domains[0]!.name, options: domains.map((item) => ({ value: item.name, label: `@${item.name}` })) },
          passwordField(scope.ctx),
          { name: 'quotaMb', kind: 'number', label: t('quotaMb'), hint: t('quotaHint') },
        ],
        submit: { label: t('create'), action: { method: 'POST', url: `${scope.api}/mail/boxes`, success: { notice: t('created', { login: '{address}' }), result: secretResult(scope.ctx) } } },
      }]));
    }
    if (selected) {
      actions.push({
        type: 'button', variant: 'danger', label: t('deleteDomain'), icon: 'trash',
        action: { method: 'DELETE', url: `${scope.api}/mail/domains/${enc(selected.name)}`, confirm: t('deleteMailDomainConfirm', { name: selected.name }), success: { redirect: scope.href({ tab: 'mail' }) } },
      });
    }
  }

  const grid = await scope.grid(visible, {
    defaultSort: 'address',
    sort: { address: (box) => box.address, size: (box) => box.usedMb },
    text: (box) => `${box.address} ${box.forward ?? ''} ${box.note ?? ''}`,
    segments: domains.length ? {
      name: 'domain',
      value: domain,
      items: [
        { label: t('allDomains'), value: '', count: boxes.length },
        ...domains.map((item) => ({ label: `@${item.name}`, value: item.name, count: boxes.filter((box) => box.address.endsWith(`@${item.name}`)).length })),
      ],
    } : undefined,
    columns: [
      { key: 'address', label: t('mailbox') },
      { key: 'size', label: t('quota'), width: '180px' },
      { key: 'forward', label: t('forward') },
      { key: 'actions', label: '', align: 'right', width: '1%' },
    ],
    row: (box) => {
      const url = `${scope.api}/mail/boxes/${enc(box.address)}`;
      const fill = percent(box.usedMb, box.quotaMb);
      return {
        key: box.address,
        tone: box.active ? undefined : 'muted',
        cells: {
          address: [ui.text({ b: box.address }), ...(box.note ? [ui.muted(box.note)] : [])],
          size: [{ type: 'progress', value: fill, tone: usageTone(fill), label: `${formatSize(box.usedMb)} / ${box.quotaMb ? formatSize(box.quotaMb) : '∞'}` }],
          forward: [ui.muted(box.forward ?? '—')],
          actions: [{
            type: 'actions',
            items: scope.manage ? [
              { type: 'button', label: t('resetPassword'), icon: 'key', action: { method: 'POST', url: `${url}/password`, confirm: t('resetPasswordConfirm', { login: box.address }), success: { result: secretResult(scope.ctx), reload: false } } },
              { type: 'button', label: t('delete'), icon: 'trash', variant: 'danger', action: { method: 'DELETE', url: `${url}`, confirm: t('deleteMailboxConfirm', { name: box.address }) } },
            ] : [],
          }],
        },
      };
    },
    empty: domains.length ? t('noMailboxesYet') : t('mailNeedDomain'),
  });

  const title = `${t('mailboxes')} · ${boxes.length}`;
  const subtitle = selected
    ? `@${selected.name}${selected.dkim ? ' · DKIM' : ''}${selected.active ? '' : ` · ${t('off')}`}`
    : t('mailDomainsCount', { count: domains.length });
  return [panel(title, [grid], { flush: true, actions, subtitle })];
};
