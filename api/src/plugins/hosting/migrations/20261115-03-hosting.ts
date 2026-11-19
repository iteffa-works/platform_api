import { DataTypes, QueryTypes } from 'sequelize';
import type { MigrationContext } from '../../../flowaxy/db/index.js';

/**
 * ispmanager → hosting: панель стає провайдером, зʼявляються тарифи хостингу, оплата й використання ресурсів.
 * Дані наявних серверів і акаунтів зберігаються.
 */
export async function up({ queryInterface, sequelize }: MigrationContext): Promise<void> {
  const charset = { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' };

  await queryInterface.renameTable('isp_servers', 'hosting_servers');
  await queryInterface.addColumn('hosting_servers', 'provider', { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'ispmanager6' });
  await queryInterface.addColumn('hosting_servers', 'location', { type: DataTypes.STRING(2), allowNull: true });
  await queryInterface.addColumn('hosting_servers', 'ipv4', { type: DataTypes.STRING(255), allowNull: true });
  await queryInterface.addColumn('hosting_servers', 'ipv6', { type: DataTypes.STRING(255), allowNull: true });
  await queryInterface.addColumn('hosting_servers', 'maxAccounts', { type: DataTypes.INTEGER.UNSIGNED, allowNull: true });
  await queryInterface.addColumn('hosting_servers', 'isPublic', { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true });

  await queryInterface.createTable('hosting_plans', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    slug: { type: DataTypes.STRING(32), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(80), allowNull: false },
    description: { type: DataTypes.STRING(255), allowNull: true },
    priceCents: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    package: { type: DataTypes.STRING(64), allowNull: false },
    diskMb: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    sites: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  }, charset);

  await queryInterface.renameTable('isp_accounts', 'hosting_accounts');
  // Логін можна використати повторно після видалення акаунта — унікальність перевіряє сервіс серед невидалених
  // Спершу новий індекс: старий (isp_accounts_*) обслуговує зовнішній ключ serverId і без заміни не видаляється
  await queryInterface.addIndex('hosting_accounts', ['serverId', 'panelUser'], { name: 'hosting_accounts_server_panel_user' });
  await queryInterface.removeIndex('hosting_accounts', 'isp_accounts_server_id_panel_user');
  await queryInterface.addColumn('hosting_accounts', 'planId', {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    references: { model: 'hosting_plans', key: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  });
  await queryInterface.addColumn('hosting_accounts', 'suspendReason', { type: DataTypes.STRING(16), allowNull: true });
  await queryInterface.addColumn('hosting_accounts', 'paidUntil', { type: DataTypes.DATE, allowNull: true });
  await queryInterface.addColumn('hosting_accounts', 'autoRenew', { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true });
  await queryInterface.addColumn('hosting_accounts', 'remindedAt', { type: DataTypes.DATE, allowNull: true });
  await queryInterface.addColumn('hosting_accounts', 'note', { type: DataTypes.STRING(255), allowNull: true });
  await queryInterface.addColumn('hosting_accounts', 'diskUsedMb', { type: DataTypes.FLOAT, allowNull: true });
  await queryInterface.addColumn('hosting_accounts', 'diskLimitMb', { type: DataTypes.FLOAT, allowNull: true });
  await queryInterface.addColumn('hosting_accounts', 'sitesUsed', { type: DataTypes.INTEGER.UNSIGNED, allowNull: true });
  await queryInterface.addColumn('hosting_accounts', 'sitesLimit', { type: DataTypes.INTEGER.UNSIGNED, allowNull: true });
  await queryInterface.addColumn('hosting_accounts', 'usageAt', { type: DataTypes.DATE, allowNull: true });
  await queryInterface.addColumn('hosting_accounts', 'deletedAt', { type: DataTypes.DATE, allowNull: true });
  await queryInterface.addIndex('hosting_accounts', ['status', 'paidUntil']);

  // Право ролей ispmanager → hosting, стан плагіна
  const roles = await sequelize.query<{ id: number; permissions: string | Record<string, string> }>(
    'SELECT id, permissions FROM roles', { type: QueryTypes.SELECT },
  );
  for (const role of roles) {
    const permissions = typeof role.permissions === 'string' ? JSON.parse(role.permissions) as Record<string, string> : role.permissions;
    if (!permissions?.ispmanager) continue;
    permissions.hosting = permissions.ispmanager;
    delete permissions.ispmanager;
    await sequelize.query('UPDATE roles SET permissions = ? WHERE id = ?', { replacements: [JSON.stringify(permissions), role.id] });
  }
  await sequelize.query("DELETE FROM plugin_states WHERE name = 'ispmanager'");
}

export async function down({ queryInterface }: MigrationContext): Promise<void> {
  await queryInterface.removeIndex('hosting_accounts', ['status', 'paidUntil']);
  for (const column of ['planId', 'suspendReason', 'paidUntil', 'autoRenew', 'remindedAt', 'note', 'diskUsedMb', 'diskLimitMb', 'sitesUsed', 'sitesLimit', 'usageAt', 'deletedAt']) {
    await queryInterface.removeColumn('hosting_accounts', column);
  }
  await queryInterface.addIndex('hosting_accounts', ['serverId', 'panelUser'], { unique: true, name: 'isp_accounts_server_id_panel_user' });
  await queryInterface.removeIndex('hosting_accounts', 'hosting_accounts_server_panel_user');
  await queryInterface.renameTable('hosting_accounts', 'isp_accounts');
  await queryInterface.dropTable('hosting_plans');
  for (const column of ['provider', 'location', 'ipv4', 'ipv6', 'maxAccounts', 'isPublic']) {
    await queryInterface.removeColumn('hosting_servers', column);
  }
  await queryInterface.renameTable('hosting_servers', 'isp_servers');
}
