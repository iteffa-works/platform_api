import { migrateUp } from './migrate.js';
import { sequelize } from './sequelize.js';

export { sequelize };
export type { MigrationContext } from './migrate.js';

/** Підключення БД і застосування нових міграцій */
export async function connectDb(): Promise<void> {
  await sequelize.authenticate();
  const applied = await migrateUp();
  if (applied.length) console.log(`[db] міграції: ${applied.join(', ')}`);
}
