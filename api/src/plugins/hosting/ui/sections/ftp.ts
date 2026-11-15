/** FTP-користувачі */
import { ui, type UiNode } from '../../../../core/ui/index.js';
import { hosting } from '../../module.js';
import { code, dialogButton, enc, panel, passwordField, secretResult } from '../kit.js';
import type { PanelSectionRenderer } from './scope.js';

export const ftpSection: PanelSectionRenderer = async (scope) => {
  const { t } = scope;
  const users = await hosting.panel.ftp(scope.serverId, scope.owner);

  const actions: UiNode[] = scope.manage ? [dialogButton(t('newFtp'), t('newFtp'), [{
    type: 'form',
    layout: 'stack',
    fields: [
      await scope.ownerFieldWithOptions(),
      { name: 'name', kind: 'text', label: t('ftpUser'), required: true, autocomplete: 'off' },
      { name: 'home', kind: 'text', label: t('homeDir'), placeholder: '/', hint: t('homeDirHint') },
      passwordField(scope.ctx),
    ],
    submit: { label: t('create'), action: { method: 'POST', url: `${scope.api}/ftp`, success: { notice: t('created', { login: '{name}' }), result: secretResult(scope.ctx) } } },
  }])] : [];

  const grid = await scope.grid(users, {
    defaultSort: 'name',
    sort: { name: (user) => user.name, owner: (user) => user.owner, home: (user) => user.home },
    text: (user) => `${user.name} ${user.owner} ${user.home ?? ''}`,
    columns: [
      { key: 'name', label: t('ftpUser') },
      { key: 'owner', label: t('owner') },
      { key: 'home', label: t('homeDir') },
      { key: 'actions', label: '', align: 'right', width: '1%' },
    ],
    row: (user) => ({
      key: user.name,
      cells: {
        name: [ui.text({ b: user.name })],
        owner: [ui.text(user.owner, { size: 'sm' })],
        home: [code(user.home ?? '/')],
        actions: [{
          type: 'actions',
          items: scope.manage
            ? [{ type: 'button', label: t('delete'), icon: 'trash', variant: 'danger', action: { method: 'DELETE', url: `${scope.api}/ftp/${enc(user.name)}?owner=${enc(user.owner)}`, confirm: t('deleteFtpConfirm', { name: user.name }) } }]
            : [],
        }],
      },
    }),
    empty: scope.fixed ? t('noFtpYet') : t('empty'),
  });
  return [panel(`${t('tab.ftp')} · ${users.length}`, [grid], { flush: true, actions, subtitle: scope.fixed ? t('ftpHint') : undefined })];
};
