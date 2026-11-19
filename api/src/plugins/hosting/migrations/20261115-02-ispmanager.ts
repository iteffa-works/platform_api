import { DataTypes } from 'sequelize';
import type { MigrationContext } from '../../../flowaxy/db/index.js';

/** Сервери ISPmanager і хостинг-акаунти користувачів */
export async function up({ queryInterface }: MigrationContext): Promise<void> {
  const charset = { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' };

  await queryInterface.createTable('isp_servers', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(80), allowNull: false },
    url: { type: DataTypes.STRING(255), allowNull: false },
    username: { type: DataTypes.STRING(64), allowNull: false },
    passwordEnc: { type: DataTypes.STRING(512), allowNull: false },
    verifyTls: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    defaultPreset: { type: DataTypes.STRING(64), allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  }, charset);

  await queryInterface.createTable('isp_accounts', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    serverId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'isp_servers', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    panelUser: { type: DataTypes.STRING(64), allowNull: false },
    preset: { type: DataTypes.STRING(64), allowNull: true },
    status: { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'active' },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  }, charset);
  await queryInterface.addIndex('isp_accounts', ['serverId', 'panelUser'], { unique: true });
  await queryInterface.addIndex('isp_accounts', ['userId']);
}

export async function down({ queryInterface }: MigrationContext): Promise<void> {
  await queryInterface.dropTable('isp_accounts');
  await queryInterface.dropTable('isp_servers');
}
