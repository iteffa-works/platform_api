/** Бази даних: створення з користувачем, розмір, видалення */
import { ui, type UiNode } from '../../../../../../core/ui/index.js';
import { hosting } from '../../../../module.js';
import { formatSize } from '../../../format.js';
import { badge, dialogButton, enc, menu, ownerField, ownerFilter, panel, passwordField, removeAction, secretResult, table } from '../../../kit.js';
import type { ConsoleSection } from './context.js';

export const databasesSection: ConsoleSection = async (console) => {
  const { t } = console;
  const [databases, owners] = await Promise.all([hosting.panel.databases(console.server.id, console.owner), console.owners()]);

  const actions: UiNode[] = console.manage ? [dialogButton(t('newDatabase'), t('newDatabase'), [{
    type: 'form',
    layout: 'stack',
    fields: [
      ownerField(console.ctx, owners, console.owner),
      { name: 'name', kind: 'text', label: t('dbName'), required: true, autocomplete: 'off', placeholder: 'shop_db' },
      { name: 'user', kind: 'text', label: t('dbUser'), autocomplete: 'off', hint: t('dbUserHint') },
      passwordField(console.ctx),
    ],
    submit: { label: t('create'), action: { method: 'POST', url: `${console.api}/databases`, success: { notice: t('created', { login: '{name}' }), result: secretResult(console.ctx) } } },
  }])] : [];

  return [
    ownerFilter(console.ctx, owners, console.owner),
    panel(`${t('tab.databases')} · ${databases.length}`, [table(
      [
        { key: 'name', label: t('dbName') },
        { key: 'owner', label: t('owner') },
        { key: 'server', label: t('dbServer') },
        { key: 'size', label: t('size'), align: 'right' },
        { key: 'users', label: t('dbUsers'), align: 'right' },
        { key: 'actions', label: '', align: 'right', width: '48px' },
      ],
      databases.map((db) => ({
        key: db.key,
        cells: {
          name: [ui.text({ b: db.name })],
          owner: [ui.text(db.owner, { size: 'sm' })],
          server: [badge(db.server, 'blue')],
          size: [ui.text(formatSize(db.sizeMb), { size: 'sm' })],
          users: [ui.text(String(db.users), { size: 'sm' })],
          actions: console.manage ? [menu([removeAction(t('delete'), `${console.api}/databases/${enc(db.key)}?owner=${enc(db.owner)}`, t('deleteDatabaseConfirm', { name: db.name }))])] : [],
        },
      })),
      t('empty'),
      t('search'),
    )], { flush: true, actions }),
  ];
};
