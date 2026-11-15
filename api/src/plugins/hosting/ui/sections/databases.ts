/** Бази даних: створення з користувачем, розмір, видалення */
import { ui, type UiNode } from '../../../../core/ui/index.js';
import { hosting } from '../../module.js';
import { formatSize } from '../format.js';
import { badge, dialogButton, enc, menu, panel, passwordField, removeAction, secretResult, table } from '../kit.js';
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

  return [
    ...(await scope.ownerFilter()),
    panel(`${t('tab.databases')} · ${databases.length}`, [table(
      scope.columns([
        { key: 'name', label: t('dbName') },
        { key: 'owner', label: t('owner') },
        { key: 'server', label: t('dbServer') },
        { key: 'size', label: t('size'), align: 'right' },
        { key: 'users', label: t('dbUsers'), align: 'right' },
        { key: 'actions', label: '', align: 'right', width: '48px' },
      ]),
      databases.map((db) => ({
        key: db.key,
        cells: {
          name: [ui.text({ b: db.name })],
          owner: [ui.text(db.owner, { size: 'sm' })],
          server: [badge(db.server, 'blue')],
          size: [ui.text(formatSize(db.sizeMb), { size: 'sm' })],
          users: [ui.text(String(db.users), { size: 'sm' })],
          actions: scope.manage ? [menu([removeAction(t('delete'), `${scope.api}/databases/${enc(db.key)}?owner=${enc(db.owner)}`, t('deleteDatabaseConfirm', { name: db.name }))])] : [],
        },
      })),
      scope.fixed ? t('noDatabasesYet') : t('empty'),
      t('search'),
    )], { flush: true, actions }),
  ];
};
