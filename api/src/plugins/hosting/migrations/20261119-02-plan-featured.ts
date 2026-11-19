import { DataTypes } from 'sequelize';
import type { MigrationContext } from '../../../flowaxy/db/index.js';

/** Тариф «Популярний» — виділяється на головній сторінці й у формі замовлення */
export async function up({ queryInterface }: MigrationContext): Promise<void> {
  await queryInterface.addColumn('hosting_plans', 'isFeatured', { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false });
}

export async function down({ queryInterface }: MigrationContext): Promise<void> {
  await queryInterface.removeColumn('hosting_plans', 'isFeatured');
}
