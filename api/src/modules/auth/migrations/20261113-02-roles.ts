import { randomUUID } from 'node:crypto';
import { DataTypes, QueryTypes } from 'sequelize';
import type { MigrationContext } from '../../../core/db/index.js';

/**
 * Ролі з рівнями прав замість рядка users.role.
 * Найраніший admin → developer, інші admin → роль «Адміністратор», решта → user.
 */
const ADMIN_PERMISSIONS = { 'admin.panel': 'view', users: 'manage', roles: 'manage' };

export async function up({ queryInterface, sequelize }: MigrationContext): Promise<void> {
  await queryInterface.createTable('roles', {
    id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
    slug: { type: DataTypes.STRING(32), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(80), allowNull: false },
    description: { type: DataTypes.STRING(255), allowNull: true },
    isSystem: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    permissions: { type: DataTypes.TEXT, allowNull: false },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  }, { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });

  const now = new Date();
  const role = (slug: string, name: string, isSystem: boolean, permissions: object, description: string) => ({
    id: randomUUID(), slug, name, description, isSystem, permissions: JSON.stringify(permissions),
    createdAt: now, updatedAt: now,
  });

  const developer = role('developer', 'Розробник', true, { '*': 'manage' }, 'Власник платформи, усі права');
  const user = role('user', 'Користувач', true, {}, 'Роль за замовчуванням для нових реєстрацій');
  await queryInterface.bulkInsert('roles', [developer, user]);

  await queryInterface.addColumn('users', 'roleId', {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'roles', key: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  });

  const admins = await sequelize.query<{ id: string }>(
    "SELECT id FROM users WHERE role = 'admin' ORDER BY createdAt ASC, id ASC",
    { type: QueryTypes.SELECT },
  );

  const [owner, ...otherAdmins] = admins;
  if (owner) {
    await queryInterface.bulkUpdate('users', { roleId: developer.id }, { id: owner.id });
  }
  if (otherAdmins.length) {
    const admin = role('admin', 'Адміністратор', false, ADMIN_PERMISSIONS, 'Перенесено з попередньої ролі admin');
    await queryInterface.bulkInsert('roles', [admin]);
    await queryInterface.bulkUpdate('users', { roleId: admin.id }, { id: otherAdmins.map((item) => item.id) });
  }
  await queryInterface.bulkUpdate('users', { roleId: user.id }, { roleId: null });

  await sequelize.query('ALTER TABLE users MODIFY roleId CHAR(36) BINARY NOT NULL');
  await queryInterface.removeColumn('users', 'role');
}

export async function down({ queryInterface, sequelize }: MigrationContext): Promise<void> {
  await queryInterface.addColumn('users', 'role', {
    type: DataTypes.STRING(16),
    allowNull: false,
    defaultValue: 'user',
  });
  // Усе, крім базової ролі user, повертається як admin
  await sequelize.query(
    "UPDATE users u JOIN roles r ON r.id = u.roleId SET u.role = IF(r.slug = 'user', 'user', 'admin')",
  );

  const constraints = await sequelize.query<{ CONSTRAINT_NAME: string }>(
    `SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'roleId'
       AND REFERENCED_TABLE_NAME = 'roles'`,
    { type: QueryTypes.SELECT },
  );
  for (const constraint of constraints) {
    await queryInterface.removeConstraint('users', constraint.CONSTRAINT_NAME);
  }
  await queryInterface.removeColumn('users', 'roleId');
  await queryInterface.dropTable('roles');
}
