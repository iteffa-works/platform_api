import { DataTypes } from 'sequelize';
import type { MigrationContext } from '../../../flowaxy/db/index.js';

/** Серверні сесії: токен лише як SHA-256, відкликання й список пристроїв */
export async function up({ queryInterface }: MigrationContext): Promise<void> {
  await queryInterface.createTable('sessions', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    tokenHash: { type: DataTypes.CHAR(64), allowNull: false, unique: true },
    ip: { type: DataTypes.STRING(45), allowNull: true },
    userAgent: { type: DataTypes.STRING(255), allowNull: true },
    lastSeenAt: { type: DataTypes.DATE, allowNull: false },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
    revokedAt: { type: DataTypes.DATE, allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  }, { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });
  await queryInterface.addIndex('sessions', ['userId', 'revokedAt']);
}

export async function down({ queryInterface }: MigrationContext): Promise<void> {
  await queryInterface.dropTable('sessions');
}
