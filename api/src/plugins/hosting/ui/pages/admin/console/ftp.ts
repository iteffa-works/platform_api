/** FTP-користувачі */
import { ui, type UiNode } from '../../../../../../core/ui/index.js';
import { hosting } from '../../../../module.js';
import { code, dialogButton, enc, menu, ownerField, ownerFilter, panel, passwordField, removeAction, secretResult, table } from '../../../kit.js';
import type { ConsoleSection } from './context.js';

export const ftpSection: ConsoleSection = async (console) => {
  const { t } = console;
  const [users, owners] = await Promise.all([hosting.panel.ftp(console.server.id, console.owner), console.owners()]);

  const actions: UiNode[] = console.manage ? [dialogButton(t('newFtp'), t('newFtp'), [{
    type: 'form',
    layout: 'stack',
    fields: [
      ownerField(console.ctx, owners, console.owner),
      { name: 'name', kind: 'text', label: t('ftpUser'), required: true, autocomplete: 'off' },
      { name: 'home', kind: 'text', label: t('homeDir'), placeholder: '/', hint: t('homeDirHint') },
      passwordField(console.ctx),
    ],
    submit: { label: t('create'), action: { method: 'POST', url: `${console.api}/ftp`, success: { notice: t('created', { login: '{name}' }), result: secretResult(console.ctx) } } },
  }])] : [];

  return [
    ownerFilter(console.ctx, owners, console.owner),
    panel(`${t('tab.ftp')} · ${users.length}`, [table(
      [
        { key: 'name', label: t('ftpUser') },
        { key: 'owner', label: t('owner') },
        { key: 'home', label: t('homeDir') },
        { key: 'actions', label: '', align: 'right', width: '48px' },
      ],
      users.map((user) => ({
        key: user.name,
        cells: {
          name: [ui.text({ b: user.name })],
          owner: [ui.text(user.owner, { size: 'sm' })],
          home: [code(user.home ?? '/')],
          actions: console.manage ? [menu([removeAction(t('delete'), `${console.api}/ftp/${enc(user.name)}?owner=${enc(user.owner)}`, t('deleteFtpConfirm', { name: user.name }))])] : [],
        },
      })),
      t('empty'),
    )], { flush: true, actions }),
  ];
};
