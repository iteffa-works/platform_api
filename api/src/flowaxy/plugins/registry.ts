/**
 * Реєстр завантажених розширень і плагінів, стан плагінів (увімкнено / ні).
 * Стан — у таблиці `plugin_states` (міграція в розширенні plugins) + кеш у памʼяті:
 * перевірка на кожен запит без звернення до БД.
 */
import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize';
import { HttpError } from '../errors.js';
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
  entries.set(plugin.name, { plugin, kind, enabled: kind === 'extension' });
}

/** Чи діє плагін зараз (розширення — завжди) */
export function isEnabled(name: string): boolean {
  return entries.get(name)?.enabled ?? false;
}

/** Стан плагінів з БД; нові плагіни отримують `defaultEnabled` */
export async function loadStates(): Promise<void> {
  const plugins = [...entries.values()].filter((entry) => entry.kind === 'plugin');
  if (!plugins.length) return;

  const rows = new Map((await PluginState.findAll()).map((row) => [row.name, row.enabled]));
  for (const entry of plugins) {
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

/** Усі: спершу плагіни, далі розширення; за назвою */
export function listPlugins(): PluginInfo[] {
  return [...entries.values()]
    .map(present)
    .sort((left, right) => (left.kind === right.kind ? left.name.localeCompare(right.name) : left.kind === 'plugin' ? -1 : 1));
}

/** Увімкнені плагіни — web ховає сторінки й меню решти */
export function enabledPlugins(): string[] {
  return [...entries.values()]
    .filter((entry) => entry.kind === 'plugin' && entry.enabled)
    .map((entry) => entry.plugin.name)
    .sort();
}

/** Увімкнути / вимкнути плагін без перезапуску; хук плагіна може скасувати зміну помилкою */
export async function setEnabled(name: string, enabled: boolean): Promise<PluginInfo> {
  const entry = entries.get(name);
  if (!entry) throw new HttpError(404, 'Плагін не знайдено');
  if (entry.kind === 'extension') throw new HttpError(400, 'Розширення не вимикається');
  if (entry.enabled === enabled) return present(entry);

  await (enabled ? entry.plugin.onEnable : entry.plugin.onDisable)?.();
  await PluginState.upsert({ name, enabled });
  entry.enabled = enabled;
  return present(entry);
}
