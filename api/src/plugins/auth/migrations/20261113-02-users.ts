import { DataTypes, QueryTypes } from 'sequelize';
import type { MigrationContext } from '../../../flowaxy/db/index.js';

/**
 * Користувачі з INT-ідентифікатором і роллю.
 * Порожня таблиця users від старого sync() (UUID) замінюється; з даними — зупинка.
 */
export async function up({ queryInterface, sequelize }: MigrationContext): Promise<void> {
  const tables = (await queryInterface.showAllTables()).map(String);
  if (tables.includes('users')) {
    const [{ total }] = await sequelize.query<{ total: number }>(
      'SELECT COUNT(*) AS total FROM users',
      { type: QueryTypes.SELECT },
    );
    if (Number(total) > 0) {
      throw new Error('Таблиця users (старий формат) містить дані — перенесіть їх вручну перед міграцією');
    }
    await queryInterface.dropTable('users');
  }

  await queryInterface.createTable('users', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    passwordHash: { type: DataTypes.STRING, allowNull: false },
    roleId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'roles', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  }, { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });
}

export async function down({ queryInterface }: MigrationContext): Promise<void> {
  await queryInterface.dropTable('users');
}
