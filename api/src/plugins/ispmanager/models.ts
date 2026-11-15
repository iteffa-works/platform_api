import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  NonAttribute,
} from 'sequelize';
import { sequelize } from '../../core/db/sequelize.js';
import { User } from '../../modules/auth/models/user.js';

/** Сервер ISPmanager; пароль адміністратора панелі — зашифрований */
export class IspServer extends Model<InferAttributes<IspServer>, InferCreationAttributes<IspServer>> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare url: string;
  declare username: string;
  declare passwordEnc: string;
  declare verifyTls: CreationOptional<boolean>;
  declare isActive: CreationOptional<boolean>;
  declare defaultPreset: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

IspServer.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(80), allowNull: false },
  url: { type: DataTypes.STRING(255), allowNull: false },
  username: { type: DataTypes.STRING(64), allowNull: false },
  passwordEnc: { type: DataTypes.STRING(512), allowNull: false },
  verifyTls: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  defaultPreset: { type: DataTypes.STRING(64), allowNull: true },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, { sequelize, tableName: 'isp_servers' });

export type AccountStatus = 'active' | 'suspended';

/** Хостинг-акаунт: користувач платформи ↔ користувач панелі на сервері */
export class IspAccount extends Model<InferAttributes<IspAccount>, InferCreationAttributes<IspAccount>> {
  declare id: CreationOptional<number>;
  declare serverId: number;
  declare userId: number;
  declare panelUser: string;
  declare preset: string | null;
  declare status: CreationOptional<AccountStatus>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare server?: NonAttribute<IspServer>;
  declare user?: NonAttribute<User>;
}

IspAccount.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  serverId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  panelUser: { type: DataTypes.STRING(64), allowNull: false },
  preset: { type: DataTypes.STRING(64), allowNull: true },
  status: { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'active' },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, { sequelize, tableName: 'isp_accounts' });

IspAccount.belongsTo(IspServer, { as: 'server', foreignKey: 'serverId' });
IspAccount.belongsTo(User, { as: 'user', foreignKey: 'userId' });
