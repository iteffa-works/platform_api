/** Бази даних: створення з користувачем, розмір, видалення */
import { ui, type UiNode } from '../../../../core/ui/index.js';
import { hosting } from '../../module.js';
import { formatSize } from '../format.js';
import { badge, dialogButton, enc, panel, passwordField, secretResult } from '../kit.js';
import type { PanelSectionRenderer } from './scope.js';

export const databasesSection: PanelSectionRenderer = async (scope) => {
  const { t } = scope;
  const databases = await hosting.panel.databases(scope.serverId, scope.owner);

  const actions: UiNode[] = scope.manage ? [dialogButton(t('newDatabase'), t('newDatabase'), [{
    type: 'form',
    layout: 'stack',
    fields: [
      await scope.ownerFieldWithOptions(),
      { name: 'name', kind: 'text', label: t('dbName'), required: true, autocomplete: 'off', placeholder: 'shop_db' },
      { name: 'user', kind: 'text', label: t('dbUser'), autocomplete: 'off', hint: t('dbUserHint') },
      passwordField(scope.ctx),
    ],
    submit: { label: t('create'), action: { method: 'POST', url: `${scope.api}/databases`, success: { notice: t('created', { login: '{name}' }), result: secretResult(scope.ctx) } } },
  }])] : [];

  const grid = await scope.grid(databases, {
    defaultSort: 'name',
    sort: { name: (db) => db.name, owner: (db) => db.owner, size: (db) => db.sizeMb, users: (db) => db.users },
    text: (db) => `${db.name} ${db.owner} ${db.server}`,
    columns: [
      { key: 'name', label: t('dbName') },
      { key: 'owner', label: t('owner') },
      { key: 'server', label: t('dbServer') },
      { key: 'size', label: t('size'), align: 'right' },
      { key: 'users', label: t('dbUsers'), align: 'right' },
      { key: 'actions', label: '', align: 'right', width: '1%' },
    ],
    row: (db) => ({
      key: db.key,
      cells: {
        name: [ui.text({ b: db.name })],
        owner: [ui.text(db.owner, { size: 'sm' })],
        server: [badge(db.server, 'blue')],
        size: [ui.text(formatSize(db.sizeMb), { size: 'sm' })],
        users: [ui.text(String(db.users), { size: 'sm' })],
        actions: [{
          type: 'actions',
          items: scope.manage
            ? [{ type: 'button', label: t('delete'), icon: 'trash', variant: 'danger', action: { method: 'DELETE', url: `${scope.api}/databases/${enc(db.key)}?owner=${enc(db.owner)}`, confirm: t('deleteDatabaseConfirm', { name: db.name }) } }]
            : [],
        }],
      },
    }),
    empty: scope.fixed ? t('noDatabasesYet') : t('empty'),
  });
  return [panel(`${t('tab.databases')} · ${databases.length}`, [grid], { flush: true, actions })];
};
