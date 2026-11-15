/**
 * Діагностика інтеграції з панеллю: назви полів і приклад користувача (паролі приховано).
 * npm run hosting:probe -w api -- <serverId> [login]
 */
import { sequelize } from '../../../core/db/sequelize.js';
import { hosting } from '../module.js';

const [id, login] = process.argv.slice(2);

try {
  if (!id) throw new Error('Вкажіть id сервера: npm run hosting:probe -w api -- <serverId> [login]');
  console.log(JSON.stringify(await hosting.servers.diagnostics(Number(id), login), null, 2));
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await sequelize.close();
}
