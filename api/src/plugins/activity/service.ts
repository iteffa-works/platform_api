import { available, use } from '../../flowaxy/services/index.js';
import { ActivityLog } from './model.js';

export type ActivityParams = Record<string, string | number>;

function parse(meta: string | null): ActivityParams {
  if (!meta) return {};
  try {
    const value = JSON.parse(meta) as Record<string, unknown>;
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, typeof item === 'number' ? item : String(item)]));
  } catch {
    return {};
  }
}

/**
 * Параметри тексту подій: meta + `user` — email користувача, якого стосується дія (`meta.userId`),
 * щоб журнал показував «користувачу ivan@…», а не «користувачу #2». Без порту users — `#id`.
 */
export async function activityParams(rows: ActivityLog[]): Promise<Map<number, ActivityParams>> {
  const metas = rows.map((row) => [row.id, parse(row.meta)] as const);
  const ids = metas.flatMap(([, meta]) => (meta.userId ? [Number(meta.userId)] : []));
  const users = ids.length && available('users') ? await use('users').byIds(ids).catch(() => new Map()) : new Map();
  return new Map(metas.map(([id, meta]) => [id, meta.userId
    ? { ...meta, user: users.get(Number(meta.userId))?.email ?? `#${meta.userId}` }
    : meta]));
}

/** Останні записи журналу; текст дії перекладає web за ключем `action`; `withUser` — email автора (порт users) */
export async function listActivity({ userId, limit, withUser = false }: {
  userId?: number;
  limit: number;
  withUser?: boolean;
}) {
  const rows = await ActivityLog.findAll({ where: userId ? { userId } : {}, order: [['id', 'DESC']], limit });
  const [users, params] = await Promise.all([
    withUser ? use('users').byIds(rows.map((row) => row.userId)) : Promise.resolve(null),
    activityParams(rows),
  ]);

  return {
    entries: rows.map((row) => {
      const user = users?.get(row.userId);
      return {
        id: row.id,
        action: row.action,
        ip: row.ip,
        userAgent: row.userAgent,
        meta: row.meta ? params.get(row.id)! : null,
        createdAt: row.createdAt,
        ...(user ? { user: { id: user.id, email: user.email } } : {}),
      };
    }),
  };
}
