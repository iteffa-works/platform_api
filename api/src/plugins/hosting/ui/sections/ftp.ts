/** FTP-користувачі */
import { ui, type UiNode } from '../../../../flowaxy/ui/index.js';
import { hosting } from '../../module.js';
import { code, dialogButton, enc, panel, passwordField, secretResult } from '../kit.js';
import type { PanelSectionRenderer } from './scope.js';

export const ftpSection: PanelSectionRenderer = async (scope) => {
  const { t } = scope;
  const users = await hosting.resources.list(scope.account, 'ftp');

  const actions: UiNode[] = scope.manage ? [dialogButton(t('newFtp'), t('newFtp'), [{
    type: 'form',
    layout: 'stack',
    fields: [
      { name: 'name', kind: 'text', label: t('ftpUser'), required: true, autocomplete: 'off' },
      { name: 'home', kind: 'text', label: t('homeDir'), placeholder: '/', hint: t('homeDirHint') },
      passwordField(scope.ctx),
    ],
    submit: { label: t('create'), action: { method: 'POST', url: `${scope.api}/ftp`, success: { notice: t('created', { login: '{name}' }), result: secretResult(scope.ctx) } } },
  }])] : [];

  const grid = await scope.grid(users, {
    defaultSort: 'name',
    sort: { name: (user) => user.name, home: (user) => user.home },
    text: (user) => `${user.name} ${user.home ?? ''}`,
    columns: [
      { key: 'name', label: t('ftpUser') },
      { key: 'home', label: t('homeDir') },
      { key: 'actions', label: '', align: 'right', width: '1%' },
    ],
    row: (user) => ({
      key: user.name,
      cells: {
        name: [ui.text({ b: user.name })],
        home: [code(user.home ?? '/')],
        actions: [{
          type: 'actions',
          items: scope.manage
            ? [{ type: 'button', label: t('delete'), icon: 'trash', variant: 'danger', action: { method: 'DELETE', url: `${scope.api}/ftp/${enc(user.name)}`, confirm: t('deleteFtpConfirm', { name: user.name }) } }]
            : [],
        }],
      },
    }),
    empty: t('noFtpYet'),
  });
  return [panel(`${t('tab.ftp')} · ${users.length}`, [grid], { flush: true, actions, subtitle: t('ftpHint') })];
};
