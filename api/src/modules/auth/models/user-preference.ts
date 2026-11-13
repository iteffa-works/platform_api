import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize';
import { sequelize } from '../../../core/db/sequelize.js';

export const THEMES = ['light', 'dark'] as const;
export type Theme = (typeof THEMES)[number];

export function isTheme(value: unknown): value is Theme {
  return THEMES.includes(value as Theme);
}

/** IANA-пояс, відомий середовищу (Europe/Kyiv, UTC, …) */
export function isTimeZone(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 64) return false;
  try {
    new Intl.DateTimeFormat('en', { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

/** Налаштування акаунта (тема інтерфейсу; далі — мова, сповіщення тощо) */
export class UserPreference extends Model<
  InferAttributes<UserPreference>,
  InferCreationAttributes<UserPreference>
> {
  declare userId: number;
  declare theme: CreationOptional<Theme | null>;
  declare timezone: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

UserPreference.init({
  userId: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true },
  theme: { type: DataTypes.STRING(8), allowNull: true },
  timezone: { type: DataTypes.STRING(64), allowNull: true },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, { sequelize, tableName: 'user_preferences' });
