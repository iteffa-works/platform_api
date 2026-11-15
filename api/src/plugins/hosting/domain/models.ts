import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  NonAttribute,
} from 'sequelize';
import { sequelize } from '../../../core/db/sequelize.js';
import { User } from '../../../modules/auth/models/user.js';

/** Сервер панелі хостингу; пароль адміністратора — зашифрований (AES-GCM) */
export class HostingServer extends Model<InferAttributes<HostingServer>, InferCreationAttributes<HostingServer>> {
  declare id: CreationOptional<number>;
  declare provider: CreationOptional<string>;
  declare name: string;
  declare url: string;
  declare username: string;
  declare passwordEnc: string;
  declare verifyTls: CreationOptional<boolean>;
  declare isActive: CreationOptional<boolean>;
  /** Доступний для замовлення користувачами */
  declare isPublic: CreationOptional<boolean>;
  declare defaultPreset: CreationOptional<string | null>;
  /** ISO 3166-1 alpha-2 */
  declare location: CreationOptional<string | null>;
  declare ipv4: CreationOptional<string | null>;
  declare ipv6: CreationOptional<string | null>;
  declare maxAccounts: CreationOptional<number | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

HostingServer.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  provider: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'ispmanager6' },
  name: { type: DataTypes.STRING(80), allowNull: false },
  url: { type: DataTypes.STRING(255), allowNull: false },
  username: { type: DataTypes.STRING(64), allowNull: false },
  passwordEnc: { type: DataTypes.STRING(512), allowNull: false },
  verifyTls: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  isPublic: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  defaultPreset: { type: DataTypes.STRING(64), allowNull: true },
  location: { type: DataTypes.STRING(2), allowNull: true },
  ipv4: { type: DataTypes.STRING(255), allowNull: true },
  ipv6: { type: DataTypes.STRING(255), allowNull: true },
  maxAccounts: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, { sequelize, tableName: 'hosting_servers' });

/** Тариф хостингу: ціна за місяць (копійки) → шаблон / пакет панелі */
export class HostingPlan extends Model<InferAttributes<HostingPlan>, InferCreationAttributes<HostingPlan>> {
  declare id: CreationOptional<number>;
  declare slug: string;
  declare name: string;
  declare description: CreationOptional<string | null>;
  declare priceCents: number;
  declare package: string;
  declare diskMb: CreationOptional<number | null>;
  declare sites: CreationOptional<number | null>;
  declare isActive: CreationOptional<boolean>;
  declare sortOrder: CreationOptional<number>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

HostingPlan.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  slug: { type: DataTypes.STRING(32), allowNull: false, unique: true },
  name: { type: DataTypes.STRING(80), allowNull: false },
  description: { type: DataTypes.STRING(255), allowNull: true },
  priceCents: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  package: { type: DataTypes.STRING(64), allowNull: false },
  diskMb: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  sites: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, { sequelize, tableName: 'hosting_plans' });

/**
 * pending — оплачено, створюється в панелі; active — працює;
 * suspended — заблоковано (адміністратором або за несплату); deleted — історія
 */
export type AccountStatus = 'pending' | 'active' | 'suspended' | 'deleted';
export type SuspendReason = 'admin' | 'billing';

/** Хостинг-акаунт: користувач платформи ↔ користувач панелі на сервері */
export class HostingAccount extends Model<InferAttributes<HostingAccount>, InferCreationAttributes<HostingAccount>> {
  declare id: CreationOptional<number>;
  declare serverId: number;
  declare userId: number;
  declare planId: CreationOptional<number | null>;
  declare panelUser: string;
  declare preset: string | null;
  declare status: CreationOptional<AccountStatus>;
  declare suspendReason: CreationOptional<SuspendReason | null>;
  /** null — без строку (привʼязаний вручну / безкоштовний) */
  declare paidUntil: CreationOptional<Date | null>;
  declare autoRenew: CreationOptional<boolean>;
  declare remindedAt: CreationOptional<Date | null>;
  declare note: CreationOptional<string | null>;
  declare diskUsedMb: CreationOptional<number | null>;
  declare diskLimitMb: CreationOptional<number | null>;
  declare sitesUsed: CreationOptional<number | null>;
  declare sitesLimit: CreationOptional<number | null>;
  declare usageAt: CreationOptional<Date | null>;
  declare deletedAt: CreationOptional<Date | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare server?: NonAttribute<HostingServer>;
  declare plan?: NonAttribute<HostingPlan | null>;
  declare user?: NonAttribute<User>;
}

HostingAccount.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  serverId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  planId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  panelUser: { type: DataTypes.STRING(64), allowNull: false },
  preset: { type: DataTypes.STRING(64), allowNull: true },
  status: { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'active' },
  suspendReason: { type: DataTypes.STRING(16), allowNull: true },
  paidUntil: { type: DataTypes.DATE, allowNull: true },
  autoRenew: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  remindedAt: { type: DataTypes.DATE, allowNull: true },
  note: { type: DataTypes.STRING(255), allowNull: true },
  diskUsedMb: { type: DataTypes.FLOAT, allowNull: true },
  diskLimitMb: { type: DataTypes.FLOAT, allowNull: true },
  sitesUsed: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  sitesLimit: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  usageAt: { type: DataTypes.DATE, allowNull: true },
  deletedAt: { type: DataTypes.DATE, allowNull: true },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, { sequelize, tableName: 'hosting_accounts' });

HostingAccount.belongsTo(HostingServer, { as: 'server', foreignKey: 'serverId' });
HostingAccount.belongsTo(HostingPlan, { as: 'plan', foreignKey: 'planId' });
HostingAccount.belongsTo(User, { as: 'user', foreignKey: 'userId' });
