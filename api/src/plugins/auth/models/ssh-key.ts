import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize';
import { sequelize } from '../../../flowaxy/db/sequelize.js';

/** Публічний SSH-ключ користувача (для доступу до послуг) */
export class SshKey extends Model<InferAttributes<SshKey>, InferCreationAttributes<SshKey>> {
  declare id: CreationOptional<number>;
  declare userId: number;
  declare title: string;
  /** ssh-ed25519, ssh-rsa, ecdsa-sha2-nistp256, … */
  declare type: string;
  declare publicKey: string;
  /** SHA256:… як у `ssh-keygen -l` */
  declare fingerprint: string;
  declare createdAt: CreationOptional<Date>;
}

SshKey.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  title: { type: DataTypes.STRING(64), allowNull: false },
  type: { type: DataTypes.STRING(32), allowNull: false },
  publicKey: { type: DataTypes.TEXT, allowNull: false },
  fingerprint: { type: DataTypes.STRING(64), allowNull: false },
  createdAt: DataTypes.DATE,
}, { sequelize, tableName: 'ssh_keys', updatedAt: false });
