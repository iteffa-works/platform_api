import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  NonAttribute,
} from 'sequelize';
import { requireModel, type Models } from '../../../db/registry.js';
import { sequelize } from '../../../db/sequelize.js';
import type { CheckResult } from './check-result.js';

export class Check extends Model<InferAttributes<Check>, InferCreationAttributes<Check>> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare accountId: string | null;
  declare status: CreationOptional<string>;
  declare total: CreationOptional<number>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare results?: NonAttribute<CheckResult[]>;
}

Check.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false },
  accountId: { type: DataTypes.UUID, allowNull: true },
  status: { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'queued' },
  total: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, { sequelize, tableName: 'checks' });

export function associate(registry: Models): void {
  const User = requireModel(registry, 'User');
  const Account = requireModel(registry, 'Account');
  Check.belongsTo(User, { foreignKey: 'userId' });
  User.hasMany(Check, { foreignKey: 'userId', onDelete: 'CASCADE' });
  Check.belongsTo(Account, { foreignKey: 'accountId' });
  Account.hasMany(Check, { foreignKey: 'accountId', onDelete: 'SET NULL' });
}
