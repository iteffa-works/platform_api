import { sequelize } from './sequelize.js';

export { sequelize };

export async function connectDb(): Promise<void> {
  await sequelize.authenticate();
  await sequelize.sync();
}
