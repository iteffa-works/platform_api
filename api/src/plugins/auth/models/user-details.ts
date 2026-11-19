import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize';
import { sequelize } from '../../../flowaxy/db/sequelize.js';

/** Персональні дані для рахунків і документів: контакти, компанія, адреса */
export class UserDetails extends Model<InferAttributes<UserDetails>, InferCreationAttributes<UserDetails>> {
  declare userId: number;
  declare phone: CreationOptional<string | null>;
  declare company: CreationOptional<string | null>;
  /** ЄДРПОУ / ІПН / VAT */
  declare taxId: CreationOptional<string | null>;
  /** ISO 3166-1 alpha-2 */
  declare country: CreationOptional<string | null>;
  declare region: CreationOptional<string | null>;
  declare city: CreationOptional<string | null>;
  declare address: CreationOptional<string | null>;
  declare postalCode: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

UserDetails.init({
  userId: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true },
  phone: { type: DataTypes.STRING(32), allowNull: true },
  company: { type: DataTypes.STRING(120), allowNull: true },
  taxId: { type: DataTypes.STRING(20), allowNull: true },
  country: { type: DataTypes.STRING(2), allowNull: true },
  region: { type: DataTypes.STRING(80), allowNull: true },
  city: { type: DataTypes.STRING(80), allowNull: true },
  address: { type: DataTypes.STRING(160), allowNull: true },
  postalCode: { type: DataTypes.STRING(16), allowNull: true },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, { sequelize, tableName: 'user_details' });

/** Поля форми: назва → максимальна довжина */
export const DETAIL_FIELDS = {
  phone: 32,
  company: 120,
  taxId: 20,
  country: 2,
  region: 80,
  city: 80,
  address: 160,
  postalCode: 16,
} as const;
export type DetailField = keyof typeof DETAIL_FIELDS;
