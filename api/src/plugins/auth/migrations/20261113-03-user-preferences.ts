import { DataTypes } from 'sequelize';
import type { MigrationContext } from '../../../flowaxy/db/index.js';

/** Налаштування акаунта: рядок на користувача; NULL — користувач ще не обирав */
export async function up({ queryInterface }: MigrationContext): Promise<void> {
  await queryInterface.createTable('user_preferences', {
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    theme: { type: DataTypes.STRING(8), allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  }, { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });
}

export async function down({ queryInterface }: MigrationContext): Promise<void> {
  await queryInterface.dropTable('user_preferences');
}
