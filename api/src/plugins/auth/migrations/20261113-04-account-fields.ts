import { DataTypes } from 'sequelize';
import type { MigrationContext } from '../../../flowaxy/db/index.js';

/** Імʼя користувача й часовий пояс (як показувати дати) */
export async function up({ queryInterface }: MigrationContext): Promise<void> {
  await queryInterface.addColumn('users', 'name', { type: DataTypes.STRING(80), allowNull: true });
  await queryInterface.addColumn('user_preferences', 'timezone', { type: DataTypes.STRING(64), allowNull: true });
}

export async function down({ queryInterface }: MigrationContext): Promise<void> {
  await queryInterface.removeColumn('user_preferences', 'timezone');
  await queryInterface.removeColumn('users', 'name');
}
