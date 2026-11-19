/**
 * Хостинг-акаунти: пошук і дії адміністратора (створити / привʼязати, строк, тариф, блокування, видалення)
 * та дії власника (вхід у панель, пароль, примітка, видалення). Побічні ефекти — через хуки.
 * Користувачі платформи — лише через порт `users` (без моделі модуля auth).
 */
import type { Request } from 'express';
import { col, fn, Op, type WhereOptions } from 'sequelize';
import { sequelize } from '../../../flowaxy/db/index.js';
import { hooks } from '../../../flowaxy/hooks/index.js';
import { use, type UserRef } from '../../../flowaxy/services/index.js';
import { createRateLimiter, HttpError } from '../../../shared/http/index.js';
import { readDate } from '../domain/input.js';
import { HostingAccount, HostingPlan, HostingServer, type AccountStatus } from '../domain/models.js';
import { addDays, generatePassword, readLogin, readNote, readPassword } from '../domain/rules.js';
import type { PanelClient } from '../providers/contracts.js';
import { panelCall } from './panel-call.js';
import { presentAccount } from './presenter.js';
import type { ServerService } from './server.service.js';
import type { SyncService } from './sync.service.js';

const STATUSES: AccountStatus[] = ['pending', 'active', 'suspended', 'deleted'];

/** Ключ сортування таблиці → колонка */
const ACCOUNT_SORT: Record<string, string> = { created: 'id', login: 'panelUser', paid: 'paidUntil', disk: 'diskUsedMb' };
export const ACCOUNT_SORT_KEYS = Object.keys(ACCOUNT_SORT);

export type AccountQuery = {
  status?: string;
  serverId?: number;
  planId?: number;
  q?: string;
  sort: { key: string; dir: 'asc' | 'desc' };
  limit: number;
  offset: number;
};

/** Екранування `%` і `_` для LIKE */
const likeOf = (text: string) => `%${text.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;

/** Запити до панелі від користувача — з лімітом: кожен навантажує панель */
const panelLimiter = createRateLimiter({ windowMs: 60_000, max: 60, message: 'Забагато запитів до панелі — зачекайте хвилину' });

export const withRelations = [
  { model: HostingServer, as: 'server' },
  { model: HostingPlan, as: 'plan' },
];

type Actor = { req?: Request | null; actorId?: number | null };

export class AccountService {
  constructor(private readonly servers: ServerService, private readonly sync: SyncService) {}

  /** Акаунт з сервером і тарифом; userId — лише власний (інакше 404, без розкриття існування) */
  async find(id: number, userId?: number): Promise<HostingAccount> {
    const account = await HostingAccount.findOne({ where: userId === undefined ? { id } : { id, userId }, include: withRelations });
    if (!account?.server) throw new HttpError(404, 'Хостинг-акаунт не знайдено');
    return account;
  }

  /** Дія в панелі над акаунтом: помилка панелі → 502, кеш сервера скидається */
  private panel<T>(account: HostingAccount, action: (client: PanelClient) => Promise<T>): Promise<T> {
    return panelCall(() => action(this.servers.client(account.server!))).finally(() => this.servers.cache.invalidate(account.serverId));
  }

  /** Подання для адмінки: email власників одним запитом */
  private async presentAdmin(accounts: HostingAccount[]) {
    const owners = await use('users').byIds(accounts.map((account) => account.userId));
    return accounts.map((account) => presentAccount(account, owners.get(account.userId) ?? null));
  }

  /* ---------- Адмінка ---------- */

  /**
   * Таблиця акаунтів: фільтри, пошук, сортування й сторінка — у SQL (LIMIT / OFFSET, COUNT).
   * Пошук — логін, примітка, email власника (id власників — з порту users).
   */
  async search(query: AccountQuery) {
    const where: WhereOptions = query.status && STATUSES.includes(query.status as AccountStatus)
      ? { status: query.status }
      : { status: { [Op.ne]: 'deleted' } };
    if (query.serverId) Object.assign(where, { serverId: query.serverId });
    if (query.planId) Object.assign(where, { planId: query.planId });
    if (query.q) {
      const like = likeOf(query.q);
      const owners = await use('users').idsByEmailLike(query.q);
      Object.assign(where, { [Op.or]: [{ panelUser: { [Op.like]: like } }, { note: { [Op.like]: like } }, ...(owners.length ? [{ userId: { [Op.in]: owners } }] : [])] });
    }
    const dir = query.sort.dir === 'desc' ? 'DESC' : 'ASC';
    const column = ACCOUNT_SORT[query.sort.key] ?? 'id';
    const { rows, count } = await HostingAccount.findAndCountAll({
      where,
      include: withRelations,
      // NULL (без строку / без даних) — в кінці незалежно від напрямку
      order: [[sequelize.literal(`\`HostingAccount\`.\`${column}\` IS NULL`), 'ASC'], [column, dir], ['id', 'DESC']],
      limit: query.limit,
      offset: query.offset,
      distinct: true,
    });
    return { accounts: await this.presentAdmin(rows), total: count };
  }

  /** Кількість акаунтів за станами (сегменти таблиці) — одним GROUP BY */
  async statusCounts(filter: { serverId?: number; planId?: number } = {}): Promise<Record<string, number>> {
    const where: WhereOptions = {};
    if (filter.serverId) Object.assign(where, { serverId: filter.serverId });
    if (filter.planId) Object.assign(where, { planId: filter.planId });
    const rows = await HostingAccount.findAll({ where, attributes: ['status', [fn('COUNT', col('id')), 'total']], group: ['status'], raw: true }) as unknown as Array<{ status: string; total: number | string }>;
    return Object.fromEntries(rows.map((row) => [row.status, Number(row.total)]));
  }

  /** Показники огляду: стани (GROUP BY), строки на тиждень, місячний дохід (SUM у SQL) */
  async stats() {
    const now = new Date();
    const [counts, expiring, revenue] = await Promise.all([
      this.statusCounts(),
      HostingAccount.count({ where: { status: 'active', paidUntil: { [Op.between]: [now, addDays(now, 7)] } } }),
      HostingAccount.findOne({
        where: { status: 'active' },
        include: [{ model: HostingPlan, as: 'plan', attributes: [] }],
        attributes: [[fn('COALESCE', fn('SUM', col('plan.priceCents')), 0), 'total']],
        raw: true,
      }) as unknown as Promise<{ total: number | string } | null>,
    ]);
    return {
      active: counts.active ?? 0,
      suspended: counts.suspended ?? 0,
      pending: counts.pending ?? 0,
      expiring,
      monthlyCents: Number(revenue?.total ?? 0),
    };
  }

  async view(id: number) {
    const [account] = await this.presentAdmin([await this.find(id)]);
    return account!;
  }

  /**
   * Адміністратор: `create` — створити в панелі без оплати, `link` — привʼязати наявного користувача панелі.
   * Строк (`paidUntil`) необовʼязковий: без нього акаунт не блокується за несплату.
   */
  async adminCreate(req: Request, actorId: number, input: Record<string, unknown>) {
    const mode = input.mode === 'link' ? 'link' : 'create';
    const server = await this.servers.find(Number(input.serverId));
    if (!server.isActive) throw new HttpError(400, 'Сервер вимкнено');

    const user: UserRef | null = await use('users').byEmail(String(input.email ?? ''));
    if (!user) throw new HttpError(404, 'Користувача не знайдено');

    const plan = input.planId ? await HostingPlan.findByPk(Number(input.planId)) : null;
    if (input.planId && !plan) throw new HttpError(404, 'Тариф не знайдено');

    // Привʼязати можна наявний логін панелі (зокрема службового формату) — лише базова перевірка
    const login = mode === 'create' ? readLogin(input.login) : String(input.login ?? '').trim();
    if (!login || login.length > 64) throw new HttpError(400, 'Логін панелі обовʼязковий');
    if (await HostingAccount.findOne({ where: { serverId: server.id, panelUser: login, status: { [Op.ne]: 'deleted' } } })) {
      throw new HttpError(409, 'Цей користувач панелі вже привʼязаний');
    }

    const client = this.servers.client(server);
    let pkg = plan?.package ?? server.defaultPreset ?? null;
    let suspended = false;
    let password: string | null = null;

    if (mode === 'create') {
      password = input.password ? readPassword(input.password) : generatePassword();
      await panelCall(() => client.accounts.create({ login, password: password!, package: pkg, name: user.email }));
    } else {
      const found = (await panelCall(() => client.accounts.list())).find((account) => account.login === login);
      if (!found) throw new HttpError(404, 'Користувача з таким логіном у панелі немає');
      pkg = found.package ?? pkg;
      suspended = found.suspended;
    }

    this.servers.cache.invalidate(server.id);
    const created = await HostingAccount.create({
      serverId: server.id,
      userId: user.id,
      planId: plan?.id ?? null,
      panelUser: login,
      preset: pkg,
      status: suspended ? 'suspended' : 'active',
      suspendReason: suspended ? 'admin' : null,
      paidUntil: readDate(input.paidUntil),
    });
    const account = await this.find(created.id);
    // Копія ресурсів нового власника — одразу (не чекаючи фонового завдання)
    await this.sync.syncAccount(account).catch(() => undefined);
    await hooks.doAction('hosting.account.created', { account, req, actorId, source: 'admin' });
    return { account: await this.view(account.id), password: input.password ? null : password };
  }

  /** Строк оплати, тариф (з шаблоном у панелі), примітка, автопродовження */
  async adminUpdate(req: Request, actorId: number, id: number, input: Record<string, unknown>) {
    const account = await this.find(id);
    if (account.status === 'deleted') throw new HttpError(400, 'Акаунт видалено');
    const patch: Partial<HostingAccount> = {};

    if (input.planId !== undefined && input.planId !== '' && Number(input.planId) !== account.planId) {
      const plan = await HostingPlan.findByPk(Number(input.planId));
      if (!plan) throw new HttpError(404, 'Тариф не знайдено');
      await this.panel(account, (client) => client.accounts.setPackage(account.panelUser, plan.package));
      Object.assign(patch, { planId: plan.id, preset: plan.package, diskLimitMb: null, sitesLimit: null });
    }
    if (input.paidUntil !== undefined) Object.assign(patch, { paidUntil: readDate(input.paidUntil), remindedAt: null });
    if (input.note !== undefined) patch.note = readNote(input.note);
    if (input.autoRenew !== undefined) patch.autoRenew = Boolean(input.autoRenew);

    await account.update(patch);
    await hooks.doAction('hosting.account.updated', { account, req, actorId });
    return { account: await this.view(id) };
  }

  /** Блокування / розблокування в панелі; reason=billing — фонове завдання */
  async setStatus(id: number, action: 'suspend' | 'resume', actor: Actor & { reason?: 'admin' | 'billing' } = {}) {
    const account = await this.find(id);
    if (account.status === 'deleted' || account.status === 'pending') throw new HttpError(400, 'Акаунт недоступний');
    await this.panel(account, (client) => (action === 'suspend' ? client.accounts.suspend(account.panelUser) : client.accounts.resume(account.panelUser)));
    if (action === 'suspend') {
      const reason = actor.reason ?? 'admin';
      await account.update({ status: 'suspended', suspendReason: reason });
      await hooks.doAction('hosting.account.suspended', { account, reason, req: actor.req, actorId: actor.actorId });
    } else {
      await account.update({ status: 'active', suspendReason: null });
      await hooks.doAction('hosting.account.resumed', { account, req: actor.req, actorId: actor.actorId });
    }
    return { account: presentAccount(account, null) };
  }

  /** Видалення: акаунт лишається в історії (status=deleted); `removeFromPanel` — також у панелі */
  async remove(id: number, removeFromPanel: boolean, actor: Actor = {}) {
    const account = await this.find(id);
    if (account.status === 'deleted') return;
    if (removeFromPanel) await this.panel(account, (client) => client.accounts.remove(account.panelUser));
    await account.update({ status: 'deleted', deletedAt: new Date(), autoRenew: false });
    await hooks.doAction('hosting.account.deleted', { account, removeFromPanel, ...actor });
  }

  /** Оновити копію даних акаунта з панелі (використання + ресурси) */
  async adminSync(id: number) {
    const account = await this.find(id);
    await panelCall(() => this.sync.syncAccount(account));
    return { account: await this.view(id) };
  }

  /** Вхід адміністратора в панель від імені користувача (підтримка) */
  async adminLoginUrl(req: Request, actorId: number, id: number) {
    const account = await this.find(id);
    const url = await this.panel(account, (client) => client.accounts.loginUrl(account.panelUser));
    await hooks.doAction('hosting.panel.changed', { req, actorId, serverId: account.serverId, section: 'accounts', action: 'update', name: `login-as ${account.panelUser}` });
    return { url };
  }

  /* ---------- Кабінет ---------- */

  async listMine(userId: number) {
    const accounts = await HostingAccount.findAll({ where: { userId }, order: [['id', 'ASC']], include: withRelations });
    return { accounts: accounts.map((account) => presentAccount(account)) };
  }

  /** Власний акаунт, з яким можна працювати в панелі: активний, сервер увімкнено; запити — з лімітом */
  assertUsable(userId: number, account: HostingAccount): HostingAccount {
    if (account.userId !== userId) throw new HttpError(404, 'Хостинг-акаунт не знайдено');
    panelLimiter.hit(`panel:${userId}`);
    if (account.status === 'suspended') throw new HttpError(403, 'Хостинг-акаунт заблоковано');
    if (account.status !== 'active') throw new HttpError(400, 'Хостинг-акаунт недоступний');
    if (!account.server!.isActive) throw new HttpError(503, 'Сервер тимчасово недоступний');
    return account;
  }

  async usable(userId: number, id: number): Promise<HostingAccount> {
    return this.assertUsable(userId, await this.find(id, userId));
  }

  /** Одноразове посилання входу в панель (ключ живе секунди й використовується один раз) */
  async loginUrlMine(req: Request, userId: number, id: number) {
    const account = await this.usable(userId, id);
    const url = await this.panel(account, (client) => client.accounts.loginUrl(account.panelUser));
    await hooks.doAction('hosting.account.panel_login', { account, req, actorId: userId });
    return { url };
  }

  async changePasswordMine(req: Request, userId: number, id: number, input: unknown) {
    const password = readPassword(input);
    const account = await this.usable(userId, id);
    await this.panel(account, (client) => client.accounts.setPassword(account.panelUser, password));
    await hooks.doAction('hosting.account.password_changed', { account, req, actorId: userId });
  }

  /** «Оновити дані»: використання й ресурси власника з панелі в копію */
  async syncMine(userId: number, id: number) {
    const account = await this.usable(userId, id);
    await panelCall(() => this.sync.syncAccount(account));
    return { account: presentAccount(account) };
  }

  async updateMine(userId: number, id: number, input: Record<string, unknown>) {
    const account = await this.find(id, userId);
    if (account.status === 'deleted') throw new HttpError(400, 'Акаунт видалено');
    const patch: Partial<Pick<HostingAccount, 'note' | 'autoRenew'>> = {};
    if (input.note !== undefined) patch.note = readNote(input.note);
    if (input.autoRenew !== undefined) patch.autoRenew = Boolean(input.autoRenew);
    await account.update(patch);
    return { account: presentAccount(account) };
  }

  /** Видалення власником: незворотно, без повернення коштів; треба ввести імʼя акаунта */
  async deleteMine(req: Request, userId: number, id: number, confirm: unknown) {
    const account = await this.usable(userId, id);
    if (String(confirm ?? '') !== account.panelUser) throw new HttpError(400, 'Для підтвердження введіть імʼя акаунта');
    await this.remove(id, true, { req, actorId: userId });
  }
}
