import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize';
import { sequelize } from '../../flowaxy/db/sequelize.js';
import { HttpError } from '../../shared/http/index.js';

/** Налаштування групи сповіщень користувача */
export class NotificationSetting extends Model<InferAttributes<NotificationSetting>, InferCreationAttributes<NotificationSetting>> {
  declare userId: number;
  declare group: string;
  declare enabled: boolean;
  declare updatedAt: CreationOptional<Date>;
}

NotificationSetting.init({
  userId: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true },
  group: { type: DataTypes.STRING(24), primaryKey: true },
  enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  updatedAt: DataTypes.DATE,
}, { sequelize, tableName: 'notification_settings', createdAt: false });

/**
 * Групи сповіщень за префіксом дії. `account` — безпека входу: вимкнути не можна,
 * щоб користувач завжди дізнавався про зміну пароля, 2FA чи невдалі входи.
 */
export const GROUPS = {
  account: { prefixes: ['auth', 'password', '2fa', 'role', 'session', 'ssh'], locked: true },
  billing: { prefixes: ['balance', 'plan'], locked: false },
  hosting: { prefixes: ['hosting'], locked: false },
  referrals: { prefixes: ['referral'], locked: false },
} as const;
export type NotificationGroup = keyof typeof GROUPS;
const NAMES = Object.keys(GROUPS) as NotificationGroup[];

export function groupOf(action: string): NotificationGroup | null {
  const prefix = action.split('.')[0]!;
  return NAMES.find((name) => (GROUPS[name].prefixes as readonly string[]).includes(prefix)) ?? null;
}

/** Чи надсилати сповіщення з цієї дії (група не вимкнена користувачем) */
export async function allowed(userId: number, action: string): Promise<boolean> {
  const group = groupOf(action);
  if (!group || GROUPS[group].locked) return true;
  const row = await NotificationSetting.findOne({ where: { userId, group } });
  return row?.enabled ?? true;
}

export async function settings(userId: number) {
  const rows = await NotificationSetting.findAll({ where: { userId } });
  const saved = new Map(rows.map((row) => [row.group, row.enabled]));
  return {
    groups: NAMES.map((group) => ({
      group,
      locked: GROUPS[group].locked,
      enabled: GROUPS[group].locked || (saved.get(group) ?? true),
    })),
  };
}

/** `{ groups: { billing: false, … } }` — змінити групи; заблоковані ігноруються */
export async function updateSettings(userId: number, input: unknown) {
  const groups = (input as { groups?: unknown } | null)?.groups;
  if (!groups || typeof groups !== 'object') throw new HttpError(400, 'Немає змін');
  for (const [group, enabled] of Object.entries(groups as Record<string, unknown>)) {
    if (!NAMES.includes(group as NotificationGroup)) throw new HttpError(400, `Невідома група: ${group}`);
    if (typeof enabled !== 'boolean') throw new HttpError(400, 'Значення групи: true або false');
    if (GROUPS[group as NotificationGroup].locked) continue;
    await NotificationSetting.upsert({ userId, group, enabled });
  }
  return settings(userId);
}
