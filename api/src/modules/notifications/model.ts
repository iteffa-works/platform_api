import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize';
import { sequelize } from '../../core/db/sequelize.js';

/** Сповіщення: `kind` = ключ дії, `params` — JSON для тексту */
export class Notification extends Model<InferAttributes<Notification>, InferCreationAttributes<Notification>> {
  declare id: CreationOptional<number>;
  declare userId: number;
  declare kind: string;
  declare params: string | null;
  declare readAt: CreationOptional<Date | null>;
  declare createdAt: CreationOptional<Date>;
}

Notification.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  kind: { type: DataTypes.STRING(48), allowNull: false },
  params: { type: DataTypes.TEXT, allowNull: true },
  readAt: { type: DataTypes.DATE, allowNull: true },
  createdAt: DataTypes.DATE,
}, { sequelize, tableName: 'notifications', updatedAt: false });
