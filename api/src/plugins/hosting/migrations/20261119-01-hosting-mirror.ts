import { DataTypes } from 'sequelize';
import type { MigrationContext } from '../../../flowaxy/db/index.js';

/**
 * Копія даних панелей у БД: обʼєкти панелі (`hosting_resources`) і стан синхронізації сервера.
 * Перша синхронізація заповнить таблицю протягом інтервалу фонового завдання.
 */
export async function up({ queryInterface }: MigrationContext): Promise<void> {
  await queryInterface.createTable('hosting_resources', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    serverId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'hosting_servers', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    kind: { type: DataTypes.STRING(16), allowNull: false },
    key: { type: DataTypes.STRING(255), allowNull: false },
    owner: { type: DataTypes.STRING(64), allowNull: true },
    data: { type: DataTypes.JSON, allowNull: false },
    hash: { type: DataTypes.CHAR(40), allowNull: false },
    syncedAt: { type: DataTypes.DATE, allowNull: false },
  }, { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });
  await queryInterface.addIndex('hosting_resources', ['serverId', 'kind', 'key'], { unique: true, name: 'hosting_resources_server_kind_key' });
  await queryInterface.addIndex('hosting_resources', ['serverId', 'owner', 'kind'], { name: 'hosting_resources_server_owner_kind' });

  await queryInterface.addColumn('hosting_servers', 'syncedAt', { type: DataTypes.DATE, allowNull: true });
  await queryInterface.addColumn('hosting_servers', 'syncError', { type: DataTypes.STRING(255), allowNull: true });
}

export async function down({ queryInterface }: MigrationContext): Promise<void> {
  await queryInterface.removeColumn('hosting_servers', 'syncError');
  await queryInterface.removeColumn('hosting_servers', 'syncedAt');
  await queryInterface.dropTable('hosting_resources');
}
