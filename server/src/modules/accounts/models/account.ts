import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize';
import { requireModel, type Models } from '../../../db/registry.js';
import { sequelize } from '../../../db/sequelize.js';

export class Account extends Model<InferAttributes<Account>, InferCreationAttributes<Account>> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare label: string;
  declare apiId: number;
  declare apiHashEnc: string;
  declare isActive: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Account.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false },
  label: { type: DataTypes.STRING(80), allowNull: false },
  apiId: { type: DataTypes.INTEGER, allowNull: false },
  apiHashEnc: { type: DataTypes.STRING, allowNull: false },
  isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, { sequelize, tableName: 'accounts' });

export function associate(registry: Models): void {
  const User = requireModel(registry, 'User');
  Account.belongsTo(User, { foreignKey: 'userId' });
  User.hasMany(Account, { foreignKey: 'userId', onDelete: 'CASCADE' });
}
