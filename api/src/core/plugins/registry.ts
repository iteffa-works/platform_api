/**
 * Реєстр завантажених плагінів і стан addon (увімкнено / ні).
 * Стан — у таблиці `plugin_states` (міграція в modules/plugins) + кеш у памʼяті:
 * перевірка на кожен запит без звернення до БД.
 */
import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize';
import { HttpError } from '../../shared/http/index.js';
import { sequelize } from '../db/sequelize.js';
import type { Plugin, PluginKind } from './types.js';

class PluginState extends Model<InferAttributes<PluginState>, InferCreationAttributes<PluginState>> {
  declare name: string;
  declare enabled: boolean;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

PluginState.init({
  name: { type: DataTypes.STRING(64), primaryKey: true },
  enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, { sequelize, tableName: 'plugin_states' });

type Entry = { plugin: Plugin; kind: PluginKind; enabled: boolean };

export type PluginInfo = {
  name: string;
  title: string;
  description: string | null;
  version: string | null;
  kind: PluginKind;
  enabled: boolean;
};

const entries = new Map<string, Entry>();

export function registerPlugin(plugin: Plugin, kind: PluginKind): void {
  if (entries.has(plugin.name)) throw new Error(`Плагін «${plugin.name}» уже зареєстровано`);
  entries.set(plugin.name, { plugin, kind, enabled: kind === 'core' });
}

/** Чи діє плагін зараз (core — завжди) */
export function isEnabled(name: string): boolean {
  return entries.get(name)?.enabled ?? false;
}

/** Стан addon з БД; нові addon отримують `defaultEnabled` */
export async function loadStates(): Promise<void> {
  const addons = [...entries.values()].filter((entry) => entry.kind === 'addon');
  if (!addons.length) return;

  const rows = new Map((await PluginState.findAll()).map((row) => [row.name, row.enabled]));
  for (const entry of addons) {
    const stored = rows.get(entry.plugin.name);
    if (stored === undefined) {
      entry.enabled = entry.plugin.defaultEnabled ?? false;
      await PluginState.create({ name: entry.plugin.name, enabled: entry.enabled });
    } else {
      entry.enabled = stored;
    }
  }
}

function present({ plugin, kind, enabled }: Entry): PluginInfo {
  return {
    name: plugin.name,
    title: plugin.title ?? plugin.name,
    description: plugin.description ?? null,
    version: plugin.version ?? null,
    kind,
    enabled,
  };
}

/** Усі плагіни: спершу addon, далі ядро; за назвою */
export function listPlugins(): PluginInfo[] {
  return [...entries.values()]
    .map(present)
    .sort((left, right) => (left.kind === right.kind ? left.name.localeCompare(right.name) : left.kind === 'addon' ? -1 : 1));
}

/** Увімкнені addon — web ховає сторінки й меню решти */
export function enabledAddons(): string[] {
  return [...entries.values()]
    .filter((entry) => entry.kind === 'addon' && entry.enabled)
    .map((entry) => entry.plugin.name)
    .sort();
}

/** Увімкнути / вимкнути addon без перезапуску; хук плагіна може скасувати зміну помилкою */
export async function setEnabled(name: string, enabled: boolean): Promise<PluginInfo> {
  const entry = entries.get(name);
  if (!entry) throw new HttpError(404, 'Плагін не знайдено');
  if (entry.kind === 'core') throw new HttpError(400, 'Модуль ядра не вимикається');
  if (entry.enabled === enabled) return present(entry);

  await (enabled ? entry.plugin.onEnable : entry.plugin.onDisable)?.();
  await PluginState.upsert({ name, enabled });
  entry.enabled = enabled;
  return present(entry);
}
