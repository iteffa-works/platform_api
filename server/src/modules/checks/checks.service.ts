import { config } from '../../config/index.js';
import { Account, Check, CheckResult } from '../../models/index.js';
import { HttpError } from '../../shared/http/index.js';
import { parseQueries } from './checks.parsers.js';
import { presentCheck } from './checks.presenters.js';

export async function createCheck(userId: string, body: { queries?: unknown; accountId?: string } | null) {
  const items = parseQueries(body?.queries);
  if (items.length === 0) throw new HttpError(400, 'Немає контактів');
  if (items.length > config.maxContacts) {
    throw new HttpError(400, `Максимум ${config.maxContacts} контактів`);
  }

  let accountId = body?.accountId || null;
  if (accountId) {
    const owned = await Account.findOne({ where: { id: accountId, userId } });
    if (!owned) throw new HttpError(400, 'Акаунт не знайдено');
  } else {
    const active = await Account.findOne({ where: { userId, isActive: true } });
    if (!active) throw new HttpError(400, 'Додайте Telegram-акаунт');
    accountId = active.id;
  }

  const check = await Check.create({ userId, accountId, status: 'queued', total: items.length });
  const rows = await CheckResult.bulkCreate(items.map((item, position) => ({
    jobId: check.id,
    position,
    query: item.query,
    kind: item.kind,
    status: item.kind === 'unknown' ? 'skipped' : 'pending',
    error: item.kind === 'unknown' ? 'invalid_input' : null,
    phone: null,
    username: null,
    firstName: null,
    lastName: null,
    telegramUserId: null,
    lastSeen: null,
    checkedAt: null,
  })));
  return presentCheck(check, rows);
}

export async function listChecks(userId: string) {
  const rows = await Check.findAll({
    where: { userId },
    order: [['createdAt', 'DESC']],
    limit: 50,
  });
  return rows.map((row) => presentCheck(row));
}

export async function getCheck(userId: string, id: string) {
  const row = await Check.findOne({ where: { id, userId } });
  if (!row) throw new HttpError(404, 'Перевірку не знайдено');
  const results = await CheckResult.findAll({ where: { jobId: row.id }, order: [['position', 'ASC']] });
  return presentCheck(row, results);
}

export async function cancelCheck(userId: string, id: string) {
  const row = await Check.findOne({ where: { id, userId } });
  if (!row) throw new HttpError(404, 'Перевірку не знайдено');
  if (row.status !== 'queued') throw new HttpError(400, 'Скасувати можна лише чергу');
  row.status = 'cancelled';
  await row.save();
  await CheckResult.update(
    { status: 'skipped', error: 'cancelled' },
    { where: { jobId: row.id, status: 'pending' } },
  );
  return getCheck(userId, id);
}
