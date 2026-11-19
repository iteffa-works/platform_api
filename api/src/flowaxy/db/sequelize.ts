import { Sequelize } from 'sequelize';
import { database } from '../settings.js';

export const sequelize = new Sequelize(database.name, database.user, database.password, {
  host: database.host,
  port: database.port,
  dialect: 'mysql',
  logging: false,
  dialectOptions: {
    connectTimeout: 10000,
  },
});
