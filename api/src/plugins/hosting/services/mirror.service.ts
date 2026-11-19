/**
 * Копія обʼєктів панелей у БД (`hosting_resources`).
 * `reconcile` зводить копію зі свіжим списком панелі: нові — вставити, змінені (інший hash) — оновити,
 * зниклі — видалити; незмінені рядки не перезаписуються. Читання сторінок — лише звідси.
 */
import { createHash } from 'node:crypto';
import { col, fn, Op, type WhereOptions } from 'sequelize';
import { HostingResource, type ResourceKindName } from '../domain/models.js';

export type MirrorItem = { key: string; owner: string | null; data: object };

/** JSON з відсортованими ключами — однаковий hash незалежно від порядку полів у відповіді панелі */
function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable((value as Record<string, unknown>)[key])}`).join(',')}}`;
  }
  return JSON.stringify(value ?? null);
}

export const hashOf = (data: unknown) => createHash('sha1').update(stable(data)).digest('hex');

export class MirrorService {
  /**
   * Звести копію розділу сервера (або одного власника — після зміни в кабінеті) зі списком панелі.
   * Повертає кількість змінених рядків.
   */
  async reconcile(serverId: number, kind: ResourceKindName, items: MirrorItem[], owner?: string): Promise<number> {
    const where: WhereOptions<HostingResource> = owner === undefined ? { serverId, kind } : { serverId, kind, owner };
    const existing = await HostingResource.findAll({ where, attributes: ['id', 'key', 'owner', 'hash'] });
    const byKey = new Map(existing.map((row) => [row.key, row]));
    const now = new Date();

    // Панель може повторити ключ — останній виграє
    const fresh = new Map(items.filter((item) => item.key).map((item) => [item.key.slice(0, 255), item]));
    const upserts = [];
    for (const [key, item] of fresh) {
      const hash = hashOf(item.data);
      const old = byKey.get(key);
      if (old && old.hash === hash && old.owner === item.owner) continue;
      upserts.push({ serverId, kind, key, owner: item.owner, data: item.data as Record<string, unknown>, hash, syncedAt: now });
    }
    const removed = existing.filter((row) => !fresh.has(row.key)).map((row) => row.id);

    // Ключ унікальний на сервері: обʼєкт, що змінив власника, оновлюється, а не дублюється
    if (upserts.length) await HostingResource.bulkCreate(upserts, { updateOnDuplicate: ['owner', 'data', 'hash', 'syncedAt'] });
    if (removed.length) await HostingResource.destroy({ where: { id: { [Op.in]: removed } } });
    return upserts.length + removed.length;
  }

  /** Обʼєкти розділу (власника) з копії, за ключем */
  async list<T>(serverId: number, kind: ResourceKindName, owner?: string): Promise<T[]> {
    const rows = await HostingResource.findAll({
      where: owner === undefined ? { serverId, kind } : { serverId, kind, owner },
      attributes: ['data'],
      order: [['key', 'ASC']],
    });
    return rows.map((row) => row.data as T);
  }

  /** Обʼєкти розділу всіх серверів (шаблони панелей — для тарифів) */
  async listAll<T>(kind: ResourceKindName): Promise<Array<{ serverId: number; data: T }>> {
    const rows = await HostingResource.findAll({ where: { kind }, attributes: ['serverId', 'data'], order: [['serverId', 'ASC'], ['key', 'ASC']] });
    return rows.map((row) => ({ serverId: row.serverId, data: row.data as T }));
  }

  /** Чи є обʼєкт у власника (перевірка перед зміною / видаленням з кабінету) */
  async owns(serverId: number, kind: ResourceKindName, key: string, owner: string): Promise<boolean> {
    return Boolean(await HostingResource.findOne({ where: { serverId, kind, key, owner }, attributes: ['id'] }));
  }

  /** Кількість обʼєктів за розділами (сервер або власник) — одним GROUP BY */
  async counts(serverId: number, owner?: string): Promise<Partial<Record<ResourceKindName, number>>> {
    const rows = await HostingResource.findAll({
      where: owner === undefined ? { serverId } : { serverId, owner },
      attributes: ['kind', [fn('COUNT', col('id')), 'total']],
      group: ['kind'],
      raw: true,
    }) as unknown as Array<{ kind: ResourceKindName; total: number | string }>;
    return Object.fromEntries(rows.map((row) => [row.kind, Number(row.total)]));
  }
}
