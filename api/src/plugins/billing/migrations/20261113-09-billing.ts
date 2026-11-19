import { DataTypes } from 'sequelize';
import type { MigrationContext } from '../../../flowaxy/db/index.js';

/** Тарифи, рахунки користувачів (тариф + баланс) і журнал операцій балансу */
export async function up({ queryInterface }: MigrationContext): Promise<void> {
  const charset = { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' };

  await queryInterface.createTable('plans', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    slug: { type: DataTypes.STRING(32), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(80), allowNull: false },
    description: { type: DataTypes.STRING(255), allowNull: true },
    priceCents: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    isDefault: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  }, charset);

  const now = new Date();
  await queryInterface.bulkInsert('plans', [{
    slug: 'free', name: 'Free', description: 'Базовий тариф', priceCents: 0,
    isDefault: true, isActive: true, sortOrder: 0, createdAt: now, updatedAt: now,
  }]);

  await queryInterface.createTable('billing_accounts', {
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    planId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'plans', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    balanceCents: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  }, charset);

  await queryInterface.createTable('balance_transactions', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    amountCents: { type: DataTypes.INTEGER, allowNull: false },
    balanceAfterCents: { type: DataTypes.INTEGER, allowNull: false },
    kind: { type: DataTypes.STRING(16), allowNull: false },
    note: { type: DataTypes.STRING(255), allowNull: true },
    actorId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    createdAt: { type: DataTypes.DATE, allowNull: false },
  }, charset);
  await queryInterface.addIndex('balance_transactions', ['userId', 'createdAt']);
}

export async function down({ queryInterface }: MigrationContext): Promise<void> {
  await queryInterface.dropTable('balance_transactions');
  await queryInterface.dropTable('billing_accounts');
  await queryInterface.dropTable('plans');
}
