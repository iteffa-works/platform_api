/**
 * Замовлення й оплата хостингу через баланс (модуль billing).
 * Гроші списуються в транзакції БД разом зі зміною акаунта; дія в панелі — після.
 * Панель відмовила — компенсація: повернення коштів (refund) і відкат стану.
 * Ціна проходить фільтр `hosting.order.price` (знижки, промокоди — без змін тут).
 */
import type { Request } from 'express';
import { Op } from 'sequelize';
import { config as appConfig } from '../../../config/index.js';
import { sequelize } from '../../../core/db/index.js';
import { hooks } from '../../../core/hooks/index.js';
import { User } from '../../../modules/auth/models/user.js';
import { formatAmount } from '../../../modules/billing/money.js';
import { balanceCents, chargeService, refundService } from '../../../modules/billing/service.js';
import { createRateLimiter, HttpError } from '../../../shared/http/index.js';
import type { HostingConfig } from '../config.js';
import { HostingAccount, type HostingPlan, type HostingServer } from '../domain/models.js';
import { addMonths, generatePassword, readLogin, readPeriod, upgradeCost } from '../domain/rules.js';
import { PanelError } from '../providers/contracts.js';
import type { AccountService } from './account.service.js';
import { panelCall } from './panel-call.js';
import type { PlanService } from './plan.service.js';
import { presentAccount, presentPlan } from './presenter.js';
import type { ServerService } from './server.service.js';

const orderLimiter = createRateLimiter({ windowMs: 10 * 60_000, max: 5, message: 'Забагато замовлень — спробуйте пізніше' });

export class OrderService {
  /** Одна операція з оплатою на користувача за раз (подвійний клік, паралельні вкладки) */
  private readonly inFlight = new Set<number>();

  constructor(
    private readonly servers: ServerService,
    private readonly plans: PlanService,
    private readonly accounts: AccountService,
    private readonly config: HostingConfig,
  ) {}

  private async exclusive<T>(userId: number, action: () => Promise<T>): Promise<T> {
    if (this.inFlight.has(userId)) throw new HttpError(409, 'Попередня операція з хостингом ще виконується');
    this.inFlight.add(userId);
    try {
      return await action();
    } finally {
      this.inFlight.delete(userId);
    }
  }

  /** Ціна за строк з урахуванням фільтрів */
  async price(plan: HostingPlan, months: number, userId: number, kind: 'order' | 'renew'): Promise<number> {
    const cents = await hooks.applyFilters('hosting.order.price', plan.priceCents * months, { plan, months, userId, kind });
    return Math.max(0, Math.round(cents));
  }

  /** Каталог для форми замовлення */
  async catalog(userId: number) {
    const [plans, servers, balance] = await Promise.all([this.plans.models(true), this.servers.available(), balanceCents(userId)]);
    return {
      currency: appConfig.currency,
      balance: formatAmount(balance),
      periods: this.config.periods,
      plans: plans.map(presentPlan),
      locations: [...new Set(servers.map((server) => server.location ?? ''))].map((code) => ({ code: code || null })),
    };
  }

  /** Логін вільний серед невидалених акаунтів платформи на сервері й серед користувачів панелі */
  private async ensureLoginFree(server: HostingServer, login: string): Promise<void> {
    const taken = await HostingAccount.findOne({ where: { serverId: server.id, panelUser: login, status: { [Op.ne]: 'deleted' } } });
    const onPanel = !taken && (await panelCall(() => this.servers.client(server).accounts.list())).some((account) => account.login === login);
    if (taken || onPanel) throw new HttpError(409, 'Це імʼя вже зайняте — оберіть інше');
  }

  /**
   * Нове замовлення: оплата → акаунт `pending` → створення в панелі → `active`.
   * Пароль панелі повертається один раз (далі — вхід без пароля з кабінету або зміна пароля).
   */
  async order(req: Request, userId: number, input: Record<string, unknown>) {
    orderLimiter.hit(`order:${userId}`);
    return this.exclusive(userId, async () => {
      const plan = await this.plans.find(Number(input.planId), true);
      const months = readPeriod(input.months);
      const login = readLogin(input.login);
      const location = input.location ? String(input.location).toUpperCase() : null;

      const server = (await this.servers.available()).find((item) => !location || item.location === location);
      if (!server) throw new HttpError(503, 'Немає вільних серверів у цьому розташуванні');
      await this.ensureLoginFree(server, login);

      const user = await User.findByPk(userId, { attributes: ['id', 'email'] });
      if (!user) throw new HttpError(401, 'Сесія недійсна');

      const price = await this.price(plan, months, userId, 'order');
      const note = `Хостинг «${plan.name}» ${login}, ${months} міс.`;
      const account = await sequelize.transaction(async (transaction) => {
        await chargeService(userId, price, note, transaction);
        return HostingAccount.create({
          serverId: server.id, userId, planId: plan.id, panelUser: login, preset: plan.package,
          status: 'pending', paidUntil: addMonths(new Date(), months),
        }, { transaction });
      });

      const password = generatePassword();
      try {
        await this.servers.client(server).accounts.create({ login, password, package: plan.package, name: user.email });
      } catch (error) {
        await sequelize.transaction(async (transaction) => {
          await refundService(userId, price, `Повернення: ${note}`, transaction);
          await account.destroy({ transaction });
        });
        if (error instanceof PanelError) throw new HttpError(502, `Панель хостингу: ${error.message}. Кошти повернено на баланс.`);
        throw error;
      }

      await account.update({ status: 'active' });
      await hooks.doAction('hosting.account.created', { account, req, actorId: userId, source: 'order' });
      return { account: presentAccount(await this.accounts.find(account.id)), password };
    });
  }

  /** Списання й нова дата в одній транзакції (рядок акаунта блокується від паралельного продовження) */
  async extend(account: HostingAccount, plan: HostingPlan, months: number, userId: number): Promise<void> {
    const price = await this.price(plan, months, userId, 'renew');
    await sequelize.transaction(async (transaction) => {
      const locked = await HostingAccount.findByPk(account.id, { transaction, lock: transaction.LOCK.UPDATE });
      if (!locked) throw new HttpError(404, 'Хостинг-акаунт не знайдено');
      await chargeService(userId, price, `Продовження хостингу ${locked.panelUser}, ${months} міс.`, transaction);
      const now = new Date();
      const from = locked.paidUntil && locked.paidUntil > now ? locked.paidUntil : now;
      await locked.update({ paidUntil: addMonths(from, months), remindedAt: null }, { transaction });
      account.set({ paidUntil: locked.paidUntil, remindedAt: null });
    });
  }

  /** Продовження: + місяці від дати закінчення (або від сьогодні, якщо прострочено) */
  async renew(req: Request | null, userId: number, id: number, monthsInput: unknown) {
    const months = readPeriod(monthsInput);
    return this.exclusive(userId, async () => {
      const account = await this.accounts.find(id, userId);
      if (account.status === 'deleted' || account.status === 'pending') throw new HttpError(400, 'Акаунт не можна продовжити');
      if (account.suspendReason === 'admin') throw new HttpError(403, 'Акаунт заблоковано адміністратором — зверніться до підтримки');
      if (!account.plan) throw new HttpError(400, 'У акаунта немає тарифу — зверніться до підтримки');

      await this.extend(account, account.plan, months, userId);
      await hooks.doAction('hosting.account.renewed', { account, req, actorId: userId, months, automatic: false });

      // Заблокований за несплату — розблокувати; не вдалося зараз — фонове завдання повторить
      if (account.status === 'suspended' && account.suspendReason === 'billing') {
        await this.accounts.setStatus(account.id, 'resume').catch(() => undefined);
      }
      return { account: presentAccount(await this.accounts.find(id)) };
    });
  }

  async changePlan(req: Request, userId: number, id: number, planIdInput: unknown) {
    return this.exclusive(userId, async () => {
      const account = await this.accounts.find(id, userId);
      if (account.status !== 'active') throw new HttpError(400, 'Тариф можна змінити лише в активного акаунта');
      const plan = await this.plans.find(Number(planIdInput), true);
      if (plan.id === account.planId) throw new HttpError(400, 'Цей тариф уже активний');
      if (plan.diskMb && account.diskUsedMb && account.diskUsedMb > plan.diskMb) throw new HttpError(400, 'Зайнятий диск перевищує обсяг цього тарифу');

      const cost = upgradeCost(account.plan?.priceCents ?? 0, plan.priceCents, account.paidUntil);
      const note = `Зміна тарифу хостингу ${account.panelUser}: «${plan.name}»`;
      if (cost > 0) await sequelize.transaction((transaction) => chargeService(userId, cost, note, transaction));

      try {
        await this.accounts.client(account).accounts.setPackage(account.panelUser, plan.package);
      } catch (error) {
        if (cost > 0) await sequelize.transaction((transaction) => refundService(userId, cost, `Повернення: ${note}`, transaction));
        if (error instanceof PanelError) throw new HttpError(502, `Панель хостингу: ${error.message}`);
        throw error;
      }

      await account.update({ planId: plan.id, preset: plan.package, diskLimitMb: null, sitesLimit: null, usageAt: null });
      await hooks.doAction('hosting.account.plan_changed', { account, req, actorId: userId, plan, costCents: cost });
      return { account: presentAccount(await this.accounts.find(id)), charged: formatAmount(cost) };
    });
  }
}
