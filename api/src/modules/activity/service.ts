import { User } from '../auth/models/user.js';
import { ActivityLog } from './model.js';

/** Останні записи журналу; текст дії перекладає web за ключем `action` */
export async function listActivity({ userId, limit, withUser = false }: {
  userId?: number;
  limit: number;
  withUser?: boolean;
}) {
  const rows = await ActivityLog.findAll({
    where: userId ? { userId } : {},
    order: [['id', 'DESC']],
    limit,
    include: withUser ? [{ model: User, as: 'user', attributes: ['id', 'email'] }] : [],
  });

  return {
    entries: rows.map((row) => ({
      id: row.id,
      action: row.action,
      ip: row.ip,
      userAgent: row.userAgent,
      meta: row.meta ? (JSON.parse(row.meta) as Record<string, unknown>) : null,
      createdAt: row.createdAt,
      ...(withUser && row.user ? { user: { id: row.user.id, email: row.user.email } } : {}),
    })),
  };
}
