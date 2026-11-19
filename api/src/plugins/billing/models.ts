import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { sequelize } from '../../flowaxy/db/sequelize.js';

/** Рахунок користувача: баланс (копійки) для оплати послуг */
export class BillingAccount extends Model<InferAttributes<BillingAccount>, InferCreationAttributes<BillingAccount>> {
  declare userId: number;
  declare balanceCents: CreationOptional<number>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

BillingAccount.init({
  userId: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true },
  balanceCents: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, { sequelize, tableName: 'billing_accounts' });

/** refund — повернення за послугу (напр. невдале створення хостингу) */
export type TransactionKind = 'topup' | 'charge' | 'adjustment' | 'refund';

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

/** Способи поповнення: переказ на картку, банківський переказ (рахунок / IBAN) */
export const TOPUP_METHODS = ['card', 'bank'] as const;
export type TopupMethod = (typeof TOPUP_METHODS)[number];
export type TopupStatus = 'pending' | 'paid' | 'cancelled';

/** Заявка на поповнення: клієнт переказує кошти з призначенням `reference`, адміністратор підтверджує */
export class BillingTopup extends Model<InferAttributes<BillingTopup>, InferCreationAttributes<BillingTopup>> {
  declare id: CreationOptional<number>;
  declare userId: number;
  declare method: TopupMethod;
  declare amountCents: number;
  declare reference: string;
  declare status: CreationOptional<TopupStatus>;
  declare note: CreationOptional<string | null>;
  declare actorId: CreationOptional<number | null>;
  declare resolvedAt: CreationOptional<Date | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

BillingTopup.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  method: { type: DataTypes.STRING(16), allowNull: false },
  amountCents: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  reference: { type: DataTypes.STRING(32), allowNull: false, unique: true },
  status: { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'pending' },
  note: { type: DataTypes.STRING(255), allowNull: true },
  actorId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  resolvedAt: { type: DataTypes.DATE, allowNull: true },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, { sequelize, tableName: 'billing_topups' });

/** Налаштування білінгу (реквізити, мінімальна сума): ключ → значення */
export class BillingSetting extends Model<InferAttributes<BillingSetting>, InferCreationAttributes<BillingSetting>> {
  declare key: string;
  declare value: string | null;
  declare updatedAt: CreationOptional<Date>;
}

BillingSetting.init({
  key: { type: DataTypes.STRING(64), primaryKey: true },
  value: { type: DataTypes.TEXT, allowNull: true },
  updatedAt: DataTypes.DATE,
}, { sequelize, tableName: 'billing_settings', createdAt: false });
