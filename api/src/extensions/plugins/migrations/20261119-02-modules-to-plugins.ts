import type { MigrationContext } from '../../../flowaxy/db/index.js';

/**
 * Колишні модулі ядра стали плагінами (activity, admin, auth, billing, cabinet, client-api, notifications).
 * Вони були завжди увімкнені — зберегти це: рядок стану, записаний вимкненим до появи `defaultEnabled`, — увімкнути.
 */
const FORMER_MODULES = ['activity', 'admin', 'auth', 'billing', 'cabinet', 'client-api', 'notifications'];

export async function up({ sequelize }: MigrationContext): Promise<void> {
  await sequelize.query('UPDATE plugin_states SET enabled = 1, updatedAt = NOW() WHERE name IN (?)', { replacements: [FORMER_MODULES] });
}

export async function down(): Promise<void> {
  // Стан плагінів не відкочується: вимкнення — лише свідомо, в адмінці
}
