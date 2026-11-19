import type { MigrationContext } from '../../../flowaxy/db/index.js';

/** Плагін cabinet увійшов в auth («мій акаунт») — прибрати його рядок стану */
export async function up({ sequelize }: MigrationContext): Promise<void> {
  await sequelize.query("DELETE FROM plugin_states WHERE name = 'cabinet'");
}

export async function down(): Promise<void> {
  // Нічого відновлювати: стан cabinet більше не використовується
}
