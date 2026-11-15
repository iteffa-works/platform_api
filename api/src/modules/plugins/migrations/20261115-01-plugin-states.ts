import { DataTypes } from 'sequelize';
import type { MigrationContext } from '../../../core/db/index.js';

/** Стан addon-плагінів (увімкнено / ні) */
export async function up({ queryInterface }: MigrationContext): Promise<void> {
  await queryInterface.createTable('plugin_states', {
    name: { type: DataTypes.STRING(64), primaryKey: true },
    enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  }, { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });
}

export async function down({ queryInterface }: MigrationContext): Promise<void> {
  await queryInterface.dropTable('plugin_states');
}
