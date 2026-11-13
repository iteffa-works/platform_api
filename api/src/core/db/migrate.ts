import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { QueryInterface, Sequelize } from 'sequelize';
import { SequelizeStorage, Umzug } from 'umzug';
import { pluginFiles } from '../plugins/discover.js';
import { sequelize } from './sequelize.js';

/** Контекст міграції: `modules/<name>/migrations/<YYYYMMDD-NN-опис>.ts` */
export type MigrationContext = {
  queryInterface: QueryInterface;
  sequelize: Sequelize;
};

type MigrationModule = {
  up: (context: MigrationContext) => Promise<void>;
  down?: (context: MigrationContext) => Promise<void>;
};

async function createMigrator() {
  const files = await pluginFiles('migrations');

  return new Umzug<MigrationContext>({
    migrations: files.map((file) => {
      const load = () => import(pathToFileURL(file).href) as Promise<MigrationModule>;
      return {
        // Імʼя без розширення: однакове для .ts (dev) і .js (dist)
        name: path.basename(file).replace(/\.[jt]s$/, ''),
        up: async ({ context }) => (await load()).up(context),
        down: async ({ context }) => {
          const mod = await load();
          if (!mod.down) throw new Error(`Міграція ${path.basename(file)} не має down`);
          await mod.down(context);
        },
      };
    }),
    context: { queryInterface: sequelize.getQueryInterface(), sequelize },
    storage: new SequelizeStorage({ sequelize, tableName: 'migrations' }),
    logger: undefined,
  });
}

/** Застосувати всі нові міграції; повертає їх імена */
export async function migrateUp(): Promise<string[]> {
  const applied = await (await createMigrator()).up();
  return applied.map((item) => item.name);
}

/** Відкотити останню міграцію */
export async function migrateDown(): Promise<string[]> {
  const reverted = await (await createMigrator()).down();
  return reverted.map((item) => item.name);
}
