import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  NonAttribute,
} from 'sequelize';
import type { Permissions } from '../../../core/access/index.js';
import { sequelize } from '../../../core/db/sequelize.js';

/** Системні ролі: існують завжди, не видаляються */
export const DEVELOPER_ROLE = 'developer';
export const DEFAULT_ROLE = 'user';

/** Роль = набір «ресурс → рівень»; створюється й редагується в адмінці */
export class Role extends Model<InferAttributes<Role>, InferCreationAttributes<Role>> {
  declare id: CreationOptional<string>;
  declare slug: string;
  declare name: string;
  declare description: CreationOptional<string | null>;
  declare isSystem: CreationOptional<boolean>;
  declare permissions: Permissions;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  get isDeveloper(): NonAttribute<boolean> {
    return this.slug === DEVELOPER_ROLE;
  }
}

Role.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  slug: { type: DataTypes.STRING(32), allowNull: false, unique: true },
  name: { type: DataTypes.STRING(80), allowNull: false },
  description: { type: DataTypes.STRING(255), allowNull: true },
  isSystem: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  // JSON у TEXT: MariaDB віддає JSON-колонки рядком
  permissions: {
    type: DataTypes.TEXT,
    allowNull: false,
    get(): Permissions {
      return JSON.parse((this.getDataValue('permissions') as unknown as string) || '{}') as Permissions;
    },
    set(value: Permissions) {
      this.setDataValue('permissions', JSON.stringify(value) as unknown as Permissions);
    },
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, { sequelize, tableName: 'roles' });

export async function findRoleBySlug(slug: string): Promise<Role> {
  const role = await Role.findOne({ where: { slug } });
  if (!role) throw new Error(`Системна роль «${slug}» відсутня — виконайте міграції`);
  return role;
}
