import { DataTypes } from 'sequelize';
import type { MigrationContext } from '../../../flowaxy/db/index.js';

/**
 * Білінг лише для оплати послуг (хостинг): прибрано тарифи платформи; поповнення балансу — заявки
 * (на картку / банківський переказ), які підтверджує адміністратор; реквізити — налаштування в адмінці.
 */
export async function up({ queryInterface }: MigrationContext): Promise<void> {
  const charset = { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' };

  // Тарифи платформи: спершу зовнішній ключ billing_accounts.planId (імʼя обмеження залежить від БД)
  const references = await queryInterface.getForeignKeyReferencesForTable('billing_accounts') as Array<{ columnName: string; constraintName: string }>;
  for (const reference of references.filter((item) => item.columnName === 'planId')) {
    await queryInterface.removeConstraint('billing_accounts', reference.constraintName);
  }
  await queryInterface.removeColumn('billing_accounts', 'planId');
  await queryInterface.dropTable('plans');

  await queryInterface.createTable('billing_topups', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    method: { type: DataTypes.STRING(16), allowNull: false },
    amountCents: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    /** Призначення платежу — за ним адміністратор знаходить переказ */
    reference: { type: DataTypes.STRING(32), allowNull: false, unique: true },
    status: { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'pending' },
    note: { type: DataTypes.STRING(255), allowNull: true },
    actorId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    resolvedAt: { type: DataTypes.DATE, allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  }, charset);
  await queryInterface.addIndex('billing_topups', ['status', 'createdAt']);
  await queryInterface.addIndex('billing_topups', ['userId', 'createdAt']);

  await queryInterface.createTable('billing_settings', {
    key: { type: DataTypes.STRING(64), primaryKey: true },
    value: { type: DataTypes.TEXT, allowNull: true },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  }, charset);
}

export async function down({ queryInterface }: MigrationContext): Promise<void> {
  await queryInterface.dropTable('billing_settings');
  await queryInterface.dropTable('billing_topups');
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
  });
  const now = new Date();
  await queryInterface.bulkInsert('plans', [{ slug: 'free', name: 'Free', priceCents: 0, isDefault: true, isActive: true, sortOrder: 0, createdAt: now, updatedAt: now }]);
  await queryInterface.addColumn('billing_accounts', 'planId', { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 1 });
}
