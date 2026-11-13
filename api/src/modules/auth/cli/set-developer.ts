/**
 * Аварійна передача ролі розробника (лише з сервера, не через UI):
 *   npm run roles:set-developer -w api -- <email>
 * Поточний розробник переходить у роль за замовчуванням.
 */
import { sequelize } from '../../../core/db/index.js';
import { DEFAULT_ROLE, DEVELOPER_ROLE, findRoleBySlug } from '../models/role.js';
import { User } from '../models/user.js';

const email = String(process.argv[2] ?? '').trim().toLowerCase();

try {
  if (!email) throw new Error('Вкажіть email: npm run roles:set-developer -w api -- <email>');

  await sequelize.transaction(async (transaction) => {
    const developer = await findRoleBySlug(DEVELOPER_ROLE);
    const fallback = await findRoleBySlug(DEFAULT_ROLE);
    const target = await User.findOne({ where: { email }, transaction });
    if (!target) throw new Error(`Користувача ${email} не знайдено`);

    await User.update({ roleId: fallback.id }, { where: { roleId: developer.id }, transaction });
    target.roleId = developer.id;
    await target.save({ transaction });
  });

  console.log(`Розробник: ${email}`);
} catch (error) {
  console.error((error as Error).message);
  process.exitCode = 1;
} finally {
  await sequelize.close();
}
