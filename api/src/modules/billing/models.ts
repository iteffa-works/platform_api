import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  NonAttribute,
} from 'sequelize';
import { sequelize } from '../../core/db/sequelize.js';
import { User } from '../auth/models/user.js';

/** Тариф; ціна — у копійках за місяць */
export class Plan extends Model<InferAttributes<Plan>, InferCreationAttributes<Plan>> {
  declare id: CreationOptional<number>;
  declare slug: string;
  declare name: string;
  declare description: CreationOptional<string | null>;
  declare priceCents: CreationOptional<number>;
  declare isDefault: CreationOptional<boolean>;
  declare isActive: CreationOptional<boolean>;
  declare sortOrder: CreationOptional<number>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Plan.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  slug: { type: DataTypes.STRING(32), allowNull: false, unique: true },
  name: { type: DataTypes.STRING(80), allowNull: false },
  description: { type: DataTypes.STRING(255), allowNull: true },
  priceCents: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
  isDefault: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, { sequelize, tableName: 'plans' });

/** Рахунок користувача: поточний тариф і баланс (копійки) */
export class BillingAccount extends Model<InferAttributes<BillingAccount>, InferCreationAttributes<BillingAccount>> {
  declare userId: number;
  declare planId: number;
  declare balanceCents: CreationOptional<number>;
  declare plan?: NonAttribute<Plan>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

BillingAccount.init({
  userId: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true },
  planId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  balanceCents: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, { sequelize, tableName: 'billing_accounts' });

BillingAccount.belongsTo(Plan, { as: 'plan', foreignKey: 'planId' });

export type TransactionKind = 'topup' | 'charge' | 'adjustment';

/** Операція балансу (незмінний журнал) */
export class BalanceTransaction extends Model<
  InferAttributes<BalanceTransaction>,
  InferCreationAttributes<BalanceTransaction>
> {
  declare id: CreationOptional<number>;
  declare userId: number;
  declare amountCents: number;
  declare balanceAfterCents: number;
  declare kind: TransactionKind;
  declare note: string | null;
  declare actorId: number | null;
  declare createdAt: CreationOptional<Date>;
  declare user?: NonAttribute<User>;
}

BalanceTransaction.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  amountCents: { type: DataTypes.INTEGER, allowNull: false },
  balanceAfterCents: { type: DataTypes.INTEGER, allowNull: false },
  kind: { type: DataTypes.STRING(16), allowNull: false },
  note: { type: DataTypes.STRING(255), allowNull: true },
  actorId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  createdAt: DataTypes.DATE,
}, { sequelize, tableName: 'balance_transactions', updatedAt: false });

BalanceTransaction.belongsTo(User, { as: 'user', foreignKey: 'userId' });
