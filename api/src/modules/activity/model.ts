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
  declare user?: NonAttribute<User>;
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

ActivityLog.belongsTo(User, { as: 'user', foreignKey: 'userId' });
