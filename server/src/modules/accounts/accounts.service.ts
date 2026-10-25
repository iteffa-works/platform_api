import { sequelize } from '../../db/index.js';
import { Account } from '../../models/index.js';
import { encrypt } from '../../shared/crypto/index.js';
import { HttpError } from '../../shared/http/index.js';
import { readApiHash, readApiId, readLabel } from './accounts.validators.js';

function present(account: Account) {
  return {
    id: account.id,
    label: account.label,
    apiId: account.apiId,
    isActive: account.isActive,
    createdAt: account.createdAt,
  };
}

async function ownAccount(userId: string, id: string) {
  const account = await Account.findOne({ where: { id, userId } });
  if (!account) throw new HttpError(404, 'Акаунт не знайдено');
  return account;
}

export async function listAccounts(userId: string) {
  const rows = await Account.findAll({
    where: { userId },
    order: [['createdAt', 'ASC']],
  });
  return { accounts: rows.map(present) };
}

export async function createAccount(
  userId: string,
  input: { label: string; apiId: number; apiHash: string },
) {
  const count = await Account.count({ where: { userId } });
  const account = await Account.create({
    userId,
    label: input.label,
    apiId: input.apiId,
    apiHashEnc: encrypt(input.apiHash),
    isActive: count === 0,
  });
  return { account: present(account) };
}

export async function updateAccount(
  userId: string,
  id: string,
  body: { label?: unknown; apiId?: unknown; apiHash?: unknown; isActive?: unknown },
) {
  const account = await ownAccount(userId, id);

  if (body.label !== undefined) account.label = readLabel(body.label);
  if (body.apiId !== undefined) account.apiId = readApiId(body.apiId);
  if (body.apiHash) account.apiHashEnc = encrypt(readApiHash(body.apiHash));

  if (body.isActive === true) {
    await sequelize.transaction(async (transaction) => {
      await Account.update({ isActive: false }, { where: { userId }, transaction });
      account.isActive = true;
      await account.save({ transaction });
    });
  } else {
    await account.save();
  }

  return { account: present(account) };
}

export async function deleteAccount(userId: string, id: string) {
  const account = await ownAccount(userId, id);
  const wasActive = account.isActive;
  await account.destroy();
  if (wasActive) {
    const next = await Account.findOne({
      where: { userId },
      order: [['createdAt', 'ASC']],
    });
    if (next) {
      next.isActive = true;
      await next.save();
    }
  }
}
