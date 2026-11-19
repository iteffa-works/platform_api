import { DataTypes } from 'sequelize';
import type { MigrationContext } from '../../../flowaxy/db/index.js';

/** Ролі (набір «ресурс → рівень») і системні ролі developer / user */
export async function up({ queryInterface }: MigrationContext): Promise<void> {
  await queryInterface.createTable('roles', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    slug: { type: DataTypes.STRING(32), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(80), allowNull: false },
    description: { type: DataTypes.STRING(255), allowNull: true },
    isSystem: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    permissions: { type: DataTypes.TEXT, allowNull: false },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  }, { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });

  const now = new Date();
  await queryInterface.bulkInsert('roles', [
    {
      slug: 'developer', name: 'Розробник', description: 'Власник платформи, усі права',
      isSystem: true, permissions: JSON.stringify({ '*': 'manage' }), createdAt: now, updatedAt: now,
    },
    {
      slug: 'user', name: 'Користувач', description: 'Роль за замовчуванням для нових реєстрацій',
      isSystem: true, permissions: JSON.stringify({}), createdAt: now, updatedAt: now,
    },
  ]);
}

export async function down({ queryInterface }: MigrationContext): Promise<void> {
  await queryInterface.dropTable('roles');
}
