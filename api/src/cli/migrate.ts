/** npm run migrate -w api [-- down] */
import '../env.js';
import '../paths.js';
import { migrateDown, migrateUp } from '../flowaxy/db/migrate.js';
import { sequelize } from '../flowaxy/db/sequelize.js';

const command = process.argv[2] ?? 'up';

try {
  if (command !== 'up' && command !== 'down') throw new Error(`Невідома команда «${command}» (up | down)`);
  const names = command === 'up' ? await migrateUp() : await migrateDown();
  console.log(names.length ? `${command}: ${names.join(', ')}` : `${command}: нічого виконувати`);
} finally {
  await sequelize.close();
}
