import { DataTypes } from 'sequelize';
import type { MigrationContext } from '../../../core/db/index.js';

/**
 * Базова таблиця users. На БД, створених раніше через sync(), лише прибирає
 * дублікати унікального індексу email (артефакт sync({ alter: true })).
 */
export async function up({ queryInterface }: MigrationContext): Promise<void> {
  const tables = (await queryInterface.showAllTables()).map(String);

  if (!tables.includes('users')) {
    await queryInterface.createTable('users', {
      id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
      email: { type: DataTypes.STRING, allowNull: false, unique: true },
      passwordHash: { type: DataTypes.STRING, allowNull: false },
      role: { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'user' },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    }, { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });
    return;
  }

  const indexes = (await queryInterface.showIndex('users')) as Array<{
    name: string;
    unique: boolean;
    fields: Array<{ attribute: string }>;
  }>;
  const emailUnique = indexes.filter((index) => (
    index.unique && index.fields.length === 1 && index.fields[0].attribute === 'email'
  ));
  for (const duplicate of emailUnique.slice(1)) {
    await queryInterface.removeIndex('users', duplicate.name);
  }
}

export async function down(): Promise<void> {
  // Базову таблицю не видаляємо: у ній дані користувачів
}
