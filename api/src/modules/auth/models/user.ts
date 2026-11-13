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

/** Модель користувача платформи */
export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: CreationOptional<string>;
  declare email: string;
  declare passwordHash: string;
  declare roleId: ForeignKey<Role['id']>;
  declare role?: NonAttribute<Role>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

User.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  passwordHash: { type: DataTypes.STRING, allowNull: false },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, { sequelize, tableName: 'users' });

User.belongsTo(Role, { as: 'role', foreignKey: { name: 'roleId', allowNull: false } });
Role.hasMany(User, { foreignKey: 'roleId' });

/** Користувач разом з роллю (для перевірки прав) */
export function findUserWithRole(id: string) {
  return User.findByPk(id, { include: [{ model: Role, as: 'role' }] });
}
