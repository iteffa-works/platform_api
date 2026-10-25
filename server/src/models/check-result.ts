import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize';
import { sequelize } from '../db/index.js';

export class CheckResult extends Model<InferAttributes<CheckResult>, InferCreationAttributes<CheckResult>> {
  declare id: CreationOptional<string>;
  declare jobId: string;
  declare position: CreationOptional<number>;
  declare query: string;
  declare kind: string;
  declare status: string;
  declare phone: string | null;
  declare username: string | null;
  declare firstName: string | null;
  declare lastName: string | null;
  declare telegramUserId: string | null;
  declare lastSeen: string | null;
  declare error: string | null;
  declare checkedAt: Date | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

CheckResult.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  jobId: { type: DataTypes.UUID, allowNull: false },
  position: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  query: { type: DataTypes.STRING, allowNull: false },
  kind: { type: DataTypes.STRING(16), allowNull: false },
  status: { type: DataTypes.STRING(16), allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: true },
  username: { type: DataTypes.STRING, allowNull: true },
  firstName: { type: DataTypes.STRING, allowNull: true },
  lastName: { type: DataTypes.STRING, allowNull: true },
  telegramUserId: { type: DataTypes.STRING, allowNull: true },
  lastSeen: { type: DataTypes.STRING, allowNull: true },
  error: { type: DataTypes.STRING, allowNull: true },
  checkedAt: { type: DataTypes.DATE, allowNull: true },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, { sequelize, tableName: 'check_results' });
