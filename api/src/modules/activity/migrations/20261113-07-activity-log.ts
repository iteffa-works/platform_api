import { DataTypes } from 'sequelize';
import type { MigrationContext } from '../../../core/db/index.js';

/** Журнал дій користувачів (вхід, зміна пароля, 2FA, ролі, баланс…) */
export async function up({ queryInterface }: MigrationContext): Promise<void> {
  await queryInterface.createTable('activity_log', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    action: { type: DataTypes.STRING(48), allowNull: false },
    ip: { type: DataTypes.STRING(45), allowNull: true },
    userAgent: { type: DataTypes.STRING(255), allowNull: true },
    meta: { type: DataTypes.TEXT, allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
  }, { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });
  await queryInterface.addIndex('activity_log', ['userId', 'createdAt']);
}

export async function down({ queryInterface }: MigrationContext): Promise<void> {
  await queryInterface.dropTable('activity_log');
}
