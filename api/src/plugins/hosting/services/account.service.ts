/**
 * Хостинг-акаунти: пошук, адмінські дії (створити без оплати / привʼязати, строк, блокування, видалення)
 * і дії власника (сайти, вхід у панель, пароль, примітка, видалення). Побічні ефекти — через хуки.
 */
import type { Request } from 'express';
import { Op } from 'sequelize';
import { hooks } from '../../../core/hooks/index.js';
import { User } from '../../../modules/auth/models/user.js';
import { createRateLimiter, HttpError } from '../../../shared/http/index.js';
import type { HostingConfig } from '../config.js';
import { HostingAccount, HostingPlan, HostingServer, type AccountStatus } from '../domain/models.js';
import { addDays, generatePassword, readLogin, readNote, readPassword } from '../domain/rules.js';
import { panelCall } from './panel-call.js';
import { presentAccount } from './presenter.js';
import type { ServerService } from './server.service.js';

const STATUSES: AccountStatus[] = ['pending', 'active', 'suspended', 'deleted'];

/** Запити до панелі від користувача — з лімітом: кожен навантажує панель */
const panelLimiter = createRateLimiter({ windowMs: 60_000, max: 60, message: 'Забагато запитів до панелі — зачекайте хвилину' });

export const withRelations = [
  { model: HostingServer, as: 'server' },
  { model: HostingPlan, as: 'plan' },
];

function readDate(input: unknown): Date | null {
  if (input === null || input === '' || input === undefined) return null;
  const date = new Date(String(input));
  if (Number.isNaN(date.getTime())) throw new HttpError(400, 'Некоректна дата');
  return date;
}

export class AccountService {
  constructor(private readonly servers: ServerService, private readonly config: HostingConfig) {}

  /** Акаунт з сервером і тарифом; userId — лише власний (інакше 404, без розкриття існування) */
  async find(id: number, userId?: number): Promise<HostingAccount> {
    const account = await HostingAccount.findOne({ where: userId === undefined ? { id } : { id, userId }, include: withRelations });
    if (!account?.server) throw new HttpError(404, 'Хостинг-акаунт не знайдено');
    return account;
  }

  client(account: HostingAccount) {
    return this.servers.client(account.server!);
  }

  /* ---------- Адмінка ---------- */

  async list(filter: { status?: unknown; serverId?: number } = {}) {
    const where: Record<string, unknown> = STATUSES.includes(filter.status as AccountStatus)
      ? { status: filter.status }
      : { status: { [Op.ne]: 'deleted' } };
    if (filter.serverId) where.serverId = filter.serverId;
    const accounts = await HostingAccount.findAll({
      where,
      order: [['id', 'DESC']],
      limit: 500,
      include: [...withRelations, { model: User, as: 'user', attributes: ['id', 'email'] }],
    });
    return { accounts: accounts.map((account) => presentAccount(account, true)) };
  }

  /** Показники для огляду адмінки */
  async stats() {
    const now = new Date();
    const [active, suspended, pending, expiring, revenue] = await Promise.all([
      HostingAccount.count({ where: { status: 'active' } }),
      HostingAccount.count({ where: { status: 'suspended' } }),
      HostingAccount.count({ where: { status: 'pending' } }),
      HostingAccount.count({ where: { status: 'active', paidUntil: { [Op.between]: [now, addDays(now, 7)] } } }),
      HostingAccount.findAll({ where: { status: 'active' }, include: [{ model: HostingPlan, as: 'plan', attributes: ['priceCents'] }], attributes: ['id'] }),
    ]);
    const monthlyCents = revenue.reduce((sum, account) => sum + (account.plan?.priceCents ?? 0), 0);
    return { active, suspended, pending, expiring, monthlyCents };
  }

  /**
   * Адміністратор: `create` — створити в панелі без оплати, `link` — привʼязати наявного користувача панелі.
   * Строк (`paidUntil`) необовʼязковий: без нього акаунт не блокується за несплату.
   */
  async adminCreate(req: Request, actorId: number, input: Record<string, unknown>) {
    const mode = input.mode === 'link' ? 'link' : 'create';
    const server = await this.servers.find(Number(input.serverId));
    if (!server.isActive) throw new HttpError(400, 'Сервер вимкнено');

    const email = String(input.email ?? '').trim().toLowerCase();
    const user = await User.findOne({ where: { email }, attributes: ['id', 'email'] });
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

    const account = await HostingAccount.create({
      serverId: server.id,
      userId: user.id,
      planId: plan?.id ?? null,
      panelUser: login,
      preset: pkg,
      status: suspended ? 'suspended' : 'active',
      suspendReason: suspended ? 'admin' : null,
      paidUntil: readDate(input.paidUntil),
    });
    await hooks.doAction('hosting.account.created', { account, req, actorId, source: 'admin' });
    return { account: presentAccount(await this.find(account.id), true), password: input.password ? null : password };
  }

  /** Строк оплати, тариф (з шаблоном у панелі), примітка, автопродовження */
  async adminUpdate(req: Request, actorId: number, id: number, input: Record<string, unknown>) {
    const account = await this.find(id);
    if (account.status === 'deleted') throw new HttpError(400, 'Акаунт видалено');
    const patch: Partial<HostingAccount> = {};

    if (input.planId !== undefined && input.planId !== '' && Number(input.planId) !== account.planId) {
      const plan = await HostingPlan.findByPk(Number(input.planId));
      if (!plan) throw new HttpError(404, 'Тариф не знайдено');
      await panelCall(() => this.client(account).accounts.setPackage(account.panelUser, plan.package));
      Object.assign(patch, { planId: plan.id, preset: plan.package, diskLimitMb: null, sitesLimit: null });
    }
    if (input.paidUntil !== undefined) Object.assign(patch, { paidUntil: readDate(input.paidUntil), remindedAt: null });
    if (input.note !== undefined) patch.note = readNote(input.note);
    if (input.autoRenew !== undefined) patch.autoRenew = Boolean(input.autoRenew);

    await account.update(patch);
    await hooks.doAction('hosting.account.updated', { account, req, actorId });
    return { account: presentAccount(await this.find(id), true) };
  }

  /** Блокування / розблокування в панелі; reason=billing — фонове завдання */
  async setStatus(id: number, action: 'suspend' | 'resume', actor: { req?: Request | null; actorId?: number | null; reason?: 'admin' | 'billing' } = {}) {
    const account = await this.find(id);
    if (account.status === 'deleted' || account.status === 'pending') throw new HttpError(400, 'Акаунт недоступний');
    const accounts = this.client(account).accounts;
    await panelCall(() => (action === 'suspend' ? accounts.suspend(account.panelUser) : accounts.resume(account.panelUser)));
    if (action === 'suspend') {
      const reason = actor.reason ?? 'admin';
      await account.update({ status: 'suspended', suspendReason: reason });
      await hooks.doAction('hosting.account.suspended', { account, reason, req: actor.req, actorId: actor.actorId });
    } else {
      await account.update({ status: 'active', suspendReason: null });
      await hooks.doAction('hosting.account.resumed', { account, req: actor.req, actorId: actor.actorId });
    }
    return { account: presentAccount(account, true) };
  }

  /** Видалення: акаунт лишається в історії (status=deleted); `removeFromPanel` — також у панелі */
  async remove(id: number, removeFromPanel: boolean, actor: { req?: Request | null; actorId?: number | null } = {}) {
    const account = await this.find(id);
    if (account.status === 'deleted') return;
    if (removeFromPanel) await panelCall(() => this.client(account).accounts.remove(account.panelUser));
    await account.update({ status: 'deleted', deletedAt: new Date(), autoRenew: false });
    await hooks.doAction('hosting.account.deleted', { account, removeFromPanel, ...actor });
  }

  /** Оновити кеш використання ресурсів з панелі */
  async refreshUsage(account: HostingAccount): Promise<void> {
    const usage = await this.client(account).accounts.usage(account.panelUser);
    await account.update({ ...usage, usageAt: new Date() });
  }

  async adminRefreshUsage(id: number) {
    const account = await this.find(id);
    await panelCall(() => this.refreshUsage(account));
    return { account: presentAccount(account, true) };
  }

  /** Вхід адміністратора в панель від імені користувача (підтримка) */
  async adminLoginUrl(req: Request, actorId: number, id: number) {
    const account = await this.find(id);
    const url = await panelCall(() => this.client(account).accounts.loginUrl(account.panelUser));
    await hooks.doAction('hosting.panel.changed', { req, actorId, serverId: account.serverId, section: 'accounts', action: 'update', name: `login-as ${account.panelUser}` });
    return { url };
  }

  /* ---------- Кабінет ---------- */

  async listMine(userId: number) {
    const accounts = await HostingAccount.findAll({ where: { userId }, order: [['id', 'ASC']], include: withRelations });
    return { accounts: accounts.map((account) => presentAccount(account)) };
  }

  async viewMine(userId: number, id: number) {
    return { account: presentAccount(await this.find(id, userId)) };
  }

  /** Акаунт, з яким можна працювати в панелі: власний, активний, сервер увімкнено */
  async usable(userId: number, id: number): Promise<HostingAccount> {
    panelLimiter.hit(`panel:${userId}`);
    const account = await this.find(id, userId);
    if (account.status === 'suspended') throw new HttpError(403, 'Хостинг-акаунт заблоковано');
    if (account.status !== 'active') throw new HttpError(400, 'Хостинг-акаунт недоступний');
    if (!account.server!.isActive) throw new HttpError(503, 'Сервер тимчасово недоступний');
    return account;
  }

  async sitesMine(userId: number, id: number) {
    const account = await this.usable(userId, id);
    return { sites: await panelCall(() => this.client(account).sites.list(account.panelUser)) };
  }

  /** Одноразове посилання входу в панель (ключ живе секунди й використовується один раз) */
  async loginUrlMine(req: Request, userId: number, id: number) {
    const account = await this.usable(userId, id);
    const url = await panelCall(() => this.client(account).accounts.loginUrl(account.panelUser));
    await hooks.doAction('hosting.account.panel_login', { account, req, actorId: userId });
    return { url };
  }

  async changePasswordMine(req: Request, userId: number, id: number, input: unknown) {
    const password = readPassword(input);
    const account = await this.usable(userId, id);
    await panelCall(() => this.client(account).accounts.setPassword(account.panelUser, password));
    await hooks.doAction('hosting.account.password_changed', { account, req, actorId: userId });
  }

  async refreshUsageMine(userId: number, id: number) {
    const account = await this.usable(userId, id);
    await panelCall(() => this.refreshUsage(account));
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

  /** Строк оновлення кешу використання */
  staleUsageBefore(now = new Date()): Date {
    return addDays(now, -this.config.usageRefreshHours / 24);
  }
}
