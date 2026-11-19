import { DataTypes } from 'sequelize';
import type { MigrationContext } from '../../../flowaxy/db/index.js';

const userRef = {
  type: DataTypes.INTEGER.UNSIGNED,
  allowNull: false,
  references: { model: 'users', key: 'id' },
  onUpdate: 'CASCADE',
  onDelete: 'CASCADE',
} as const;

const utf8 = { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' };

/** Персональні дані (для рахунків), SSH-ключі; у сесіях — вхід із 2FA та останній IP */
export async function up({ queryInterface }: MigrationContext): Promise<void> {
  await queryInterface.createTable('user_details', {
    userId: { ...userRef, primaryKey: true },
    phone: { type: DataTypes.STRING(32), allowNull: true },
    company: { type: DataTypes.STRING(120), allowNull: true },
    taxId: { type: DataTypes.STRING(20), allowNull: true },
    country: { type: DataTypes.STRING(2), allowNull: true },
    region: { type: DataTypes.STRING(80), allowNull: true },
    city: { type: DataTypes.STRING(80), allowNull: true },
    address: { type: DataTypes.STRING(160), allowNull: true },
    postalCode: { type: DataTypes.STRING(16), allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  }, utf8);

  await queryInterface.createTable('ssh_keys', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    userId: userRef,
    title: { type: DataTypes.STRING(64), allowNull: false },
    type: { type: DataTypes.STRING(32), allowNull: false },
    publicKey: { type: DataTypes.TEXT, allowNull: false },
    fingerprint: { type: DataTypes.STRING(64), allowNull: false },
    createdAt: { type: DataTypes.DATE, allowNull: false },
  }, utf8);
  await queryInterface.addIndex('ssh_keys', ['userId', 'fingerprint'], { unique: true, name: 'ssh_keys_user_fingerprint' });

  await queryInterface.addColumn('sessions', 'twoFactor', { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false });
  await queryInterface.addColumn('sessions', 'lastIp', { type: DataTypes.STRING(45), allowNull: true });
}

export async function down({ queryInterface }: MigrationContext): Promise<void> {
  await queryInterface.removeColumn('sessions', 'lastIp');
  await queryInterface.removeColumn('sessions', 'twoFactor');
  await queryInterface.dropTable('ssh_keys');
  await queryInterface.dropTable('user_details');
}
