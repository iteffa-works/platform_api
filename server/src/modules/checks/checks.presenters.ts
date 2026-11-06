import type { Check } from './models/check.js';
import type { CheckResult } from './models/check-result.js';

export function presentResult(row: CheckResult) {
  return {
    id: row.id,
    query: row.query,
    kind: row.kind,
    status: row.status,
    phone: row.phone,
    username: row.username,
    firstName: row.firstName,
    lastName: row.lastName,
    telegramUserId: row.telegramUserId,
    lastSeen: row.lastSeen,
    error: row.error,
    checkedAt: row.checkedAt,
  };
}

export function presentCheck(row: Check, results?: CheckResult[]) {
  return {
    id: row.id,
    accountId: row.accountId,
    status: row.status,
    total: row.total,
    createdAt: row.createdAt,
    results: results ? results.map(presentResult) : undefined,
  };
}
