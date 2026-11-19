import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize';
import { sequelize } from '../../flowaxy/db/sequelize.js';

/** Рядок журналу дій */
export class ActivityLog extends Model<InferAttributes<ActivityLog>, InferCreationAttributes<ActivityLog>> {
  declare id: CreationOptional<number>;
  declare userId: number;
  declare action: string;
  declare ip: string | null;
  declare userAgent: string | null;
  /** JSON з деталями дії */
  declare meta: string | null;
  declare createdAt: CreationOptional<Date>;
}

ActivityLog.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  action: { type: DataTypes.STRING(48), allowNull: false },
  ip: { type: DataTypes.STRING(45), allowNull: true },
  userAgent: { type: DataTypes.STRING(255), allowNull: true },
  meta: { type: DataTypes.TEXT, allowNull: true },
  createdAt: DataTypes.DATE,
}, { sequelize, tableName: 'activity_log', updatedAt: false });

