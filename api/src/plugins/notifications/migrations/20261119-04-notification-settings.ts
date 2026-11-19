import { DataTypes } from 'sequelize';
import type { MigrationContext } from '../../../flowaxy/db/index.js';

/** Вимкнені користувачем групи сповіщень (рядок є лише для змінених груп) */
export async function up({ queryInterface }: MigrationContext): Promise<void> {
  await queryInterface.createTable('notification_settings', {
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      primaryKey: true,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    group: { type: DataTypes.STRING(24), allowNull: false, primaryKey: true },
    enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  }, { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });
}

export async function down({ queryInterface }: MigrationContext): Promise<void> {
  await queryInterface.dropTable('notification_settings');
}
