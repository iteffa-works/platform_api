import { randomBytes } from 'node:crypto';
import { DataTypes, QueryTypes } from 'sequelize';
import type { MigrationContext } from '../../../flowaxy/db/index.js';

/** 2FA, аватар, реферали (users) + мова й антифішинговий код (user_preferences) */
export async function up({ queryInterface, sequelize }: MigrationContext): Promise<void> {
  await queryInterface.addColumn('users', 'twoFactorSecret', { type: DataTypes.STRING(255), allowNull: true });
  await queryInterface.addColumn('users', 'twoFactorRecovery', { type: DataTypes.TEXT, allowNull: true });
  await queryInterface.addColumn('users', 'avatar', { type: DataTypes.STRING(64), allowNull: true });
  await queryInterface.addColumn('users', 'referralCode', { type: DataTypes.STRING(16), allowNull: true });
  await queryInterface.addColumn('users', 'referredById', {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    references: { model: 'users', key: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });

  // Реферальний код кожному наявному користувачу, далі — унікальний індекс
  const users = await sequelize.query<{ id: number }>('SELECT id FROM users', { type: QueryTypes.SELECT });
  for (const { id } of users) {
    await queryInterface.bulkUpdate('users', { referralCode: randomBytes(6).toString('hex') }, { id });
  }
  await queryInterface.addIndex('users', ['referralCode'], { unique: true, name: 'users_referral_code' });

  await queryInterface.addColumn('user_preferences', 'language', { type: DataTypes.STRING(5), allowNull: true });
  await queryInterface.addColumn('user_preferences', 'antiPhishingCode', { type: DataTypes.STRING(32), allowNull: true });
}

export async function down({ queryInterface, sequelize }: MigrationContext): Promise<void> {
  await queryInterface.removeColumn('user_preferences', 'antiPhishingCode');
  await queryInterface.removeColumn('user_preferences', 'language');
  await queryInterface.removeIndex('users', 'users_referral_code');

  const [fk] = await sequelize.query<{ CONSTRAINT_NAME: string }>(
    `SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'referredById'
       AND REFERENCED_TABLE_NAME IS NOT NULL`,
    { type: QueryTypes.SELECT },
  );
  if (fk) await queryInterface.removeConstraint('users', fk.CONSTRAINT_NAME);

  for (const column of ['referredById', 'referralCode', 'avatar', 'twoFactorRecovery', 'twoFactorSecret']) {
    await queryInterface.removeColumn('users', column);
  }
}
