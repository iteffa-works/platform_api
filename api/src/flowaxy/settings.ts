/**
 * Налаштування ядра Flowaxy. Ядро не знає про застосунок: шляхи до розширень і плагінів передає застосунок
 * через `configure()` до `loadPlugins()` / міграцій; БД — зі змінних середовища (`DB_*`), які застосунок
 * завантажує до першого імпорту моделей.
 */
export type FlowaxyOptions = {
  /** Тека розширень — системний функціонал застосунку, завжди увімкнені */
  extensionsDir: string;
  /** Тека плагінів — вмикаються / вимикаються в адмінці */
  pluginsDir: string;
};

let options: FlowaxyOptions | null = null;

export function configure(next: FlowaxyOptions): void {
  options = next;
}

export function settings(): FlowaxyOptions {
  if (!options) throw new Error('Flowaxy не налаштовано: викличте configure({ extensionsDir, pluginsDir })');
  return options;
}

/** Підключення до БД (MySQL) — зі змінних середовища */
export const database = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  name: process.env.DB_NAME || 'flowaxy',
};
