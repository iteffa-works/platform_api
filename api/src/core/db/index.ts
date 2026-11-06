import { loadModels } from './load-models.js';
import { models } from './registry.js';
import { sequelize } from './sequelize.js';

export { models, sequelize };

/** Підключення БД і синхронізація моделей */
export async function connectDb(): Promise<void> {
  await loadModels();
  await sequelize.authenticate();
  await sequelize.sync({ alter: true });
}
