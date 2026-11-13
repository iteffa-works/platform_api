import {
  CreationOptional,
  DataTypes,
  ForeignKey,
  InferAttributes,
  InferCreationAttributes,
  Model,
  NonAttribute,
} from 'sequelize';
import { sequelize } from '../../../core/db/sequelize.js';
import { Role } from './role.js';
import { UserPreference } from './user-preference.js';

/** Модель користувача платформи */
export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: CreationOptional<number>;
  declare email: string;
  declare name: CreationOptional<string | null>;
  declare passwordHash: string;
  declare roleId: ForeignKey<Role['id']>;
  declare role?: NonAttribute<Role>;
  declare preferences?: NonAttribute<UserPreference | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

User.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  name: { type: DataTypes.STRING(80), allowNull: true },
  passwordHash: { type: DataTypes.STRING, allowNull: false },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, { sequelize, tableName: 'users' });

User.belongsTo(Role, { as: 'role', foreignKey: { name: 'roleId', allowNull: false } });
Role.hasMany(User, { foreignKey: 'roleId' });
User.hasOne(UserPreference, { as: 'preferences', foreignKey: 'userId', onDelete: 'CASCADE' });

/** Звʼязки акаунта: роль (права) + налаштування */
export const ACCOUNT_INCLUDE = [
  { model: Role, as: 'role' },
  { model: UserPreference, as: 'preferences' },
];

/** Користувач разом з роллю й налаштуваннями */
export function findUserWithRole(id: number) {
  return User.findByPk(id, { include: ACCOUNT_INCLUDE });
}
