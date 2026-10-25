import { Account } from './account.js';
import { Check } from './check.js';
import { CheckResult } from './check-result.js';
import { User } from './user.js';

User.hasMany(Account, { foreignKey: 'userId', onDelete: 'CASCADE' });
Account.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Check, { foreignKey: 'userId', onDelete: 'CASCADE' });
Check.belongsTo(User, { foreignKey: 'userId' });
Account.hasMany(Check, { foreignKey: 'accountId', onDelete: 'SET NULL' });
Check.belongsTo(Account, { foreignKey: 'accountId' });
Check.hasMany(CheckResult, { foreignKey: 'jobId', onDelete: 'CASCADE' });
CheckResult.belongsTo(Check, { foreignKey: 'jobId' });
