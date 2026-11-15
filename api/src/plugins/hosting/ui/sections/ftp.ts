/** FTP-користувачі */
import { ui, type UiNode } from '../../../../core/ui/index.js';
import { hosting } from '../../module.js';
import { code, dialogButton, enc, menu, panel, passwordField, removeAction, secretResult, table } from '../kit.js';
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

  return [
    ...(await scope.ownerFilter()),
    panel(`${t('tab.ftp')} · ${users.length}`, [table(
      scope.columns([
        { key: 'name', label: t('ftpUser') },
        { key: 'owner', label: t('owner') },
        { key: 'home', label: t('homeDir') },
        { key: 'actions', label: '', align: 'right', width: '48px' },
      ]),
      users.map((user) => ({
        key: user.name,
        cells: {
          name: [ui.text({ b: user.name })],
          owner: [ui.text(user.owner, { size: 'sm' })],
          home: [code(user.home ?? '/')],
          actions: scope.manage ? [menu([removeAction(t('delete'), `${scope.api}/ftp/${enc(user.name)}?owner=${enc(user.owner)}`, t('deleteFtpConfirm', { name: user.name }))])] : [],
        },
      })),
      scope.fixed ? t('noFtpYet') : t('empty'),
    )], { flush: true, actions, subtitle: scope.fixed ? t('ftpHint') : undefined }),
  ];
};
