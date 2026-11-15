import { DataTypes } from 'sequelize';
import type { MigrationContext } from '../../../core/db/index.js';

/** Сповіщення користувачам: тип + параметри (текст будує web мовою користувача) */
export async function up({ queryInterface }: MigrationContext): Promise<void> {
  await queryInterface.createTable('notifications', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    kind: { type: DataTypes.STRING(48), allowNull: false },
    params: { type: DataTypes.TEXT, allowNull: true },
    readAt: { type: DataTypes.DATE, allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
  }, { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });
  await queryInterface.addIndex('notifications', ['userId', 'readAt']);
}

export async function down({ queryInterface }: MigrationContext): Promise<void> {
  await queryInterface.dropTable('notifications');
}
