/**
 * Фонове завдання (раз на `jobIntervalMinutes`): строки оплати, блокування, самовідновлення,
 * синхронізація копії даних панелей.
 * Кроки ідемпотентні — збій панелі повторюється наступного разу.
 * Один процес API; для кількох інстансів — винести у воркер / блокування в БД.
 */
import { Op } from 'sequelize';
import { sequelize } from '../../../flowaxy/db/index.js';
import { hooks } from '../../../flowaxy/hooks/index.js';
import { isEnabled } from '../../../flowaxy/plugins/index.js';
import { use } from '../../../flowaxy/services/index.js';
import type { HostingConfig } from '../config.js';
import { HostingAccount } from '../domain/models.js';
import { addDays } from '../domain/rules.js';
import { withRelations, type AccountService } from './account.service.js';
import type { OrderService } from './order.service.js';
import { isExpectedError } from './panel-call.js';
import type { ServerService } from './server.service.js';
import type { PlanService } from './plan.service.js';
import type { SyncService } from './sync.service.js';

const BATCH = 100;

export class LifecycleService {
  private running = false;

  constructor(
    private readonly config: HostingConfig,
    private readonly servers: ServerService,
    private readonly accounts: AccountService,
    private readonly orders: OrderService,
    private readonly sync: SyncService,
    private readonly plans: PlanService,
  ) {}

  /** Помилка панелі в кроці — у лог, без зупинки інших акаунтів */
  private async safely(label: string, account: HostingAccount, action: () => Promise<void>): Promise<void> {
    try {
      await action();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[hosting] ${label} ${account.panelUser}#${account.id}: ${message}`);
      if (!isExpectedError(error)) throw error;
    }
  }

  /** «Завислі» pending (процес упав між оплатою й панеллю): є в панелі → active, немає → повернення коштів */
  private async reconcilePending(): Promise<void> {
    const stale = await HostingAccount.findAll({
      where: { status: 'pending', createdAt: { [Op.lt]: addDays(new Date(), -10 / 1440) } },
      include: withRelations,
      limit: BATCH,
    });
    for (const account of stale) {
      await this.safely('reconcile', account, async () => {
        const exists = (await this.servers.client(account.server!).accounts.list()).some((item) => item.login === account.panelUser);
        if (exists) {
          await account.update({ status: 'active' });
          return;
        }
        const months = account.plan && account.paidUntil
          ? Math.max(1, Math.round((account.paidUntil.getTime() - account.createdAt.getTime()) / (30 * 864e5)))
          : 0;
        await sequelize.transaction(async (transaction) => {
          if (account.plan && months) {
            await use('wallet').refund(account.userId, account.plan.priceCents * months, `Повернення: хостинг ${account.panelUser} не створено`, transaction);
          }
          await account.destroy({ transaction });
        });
      });
    }
  }

  /** Нагадування за `remindDays` до кінця (одне на період оплати) */
  private async remind(now: Date): Promise<void> {
    const soon = await HostingAccount.findAll({
      where: { status: 'active', remindedAt: null, paidUntil: { [Op.gt]: now, [Op.lte]: addDays(now, this.config.remindDays) } },
      limit: BATCH,
    });
    for (const account of soon) {
      await account.update({ remindedAt: now });
      await hooks.doAction('hosting.account.expiring', { account });
    }
  }

  /** Строк минув: автопродовження на 1 міс., якщо вистачає коштів; інакше — блокування */
  private async expire(now: Date): Promise<void> {
    const expired = await HostingAccount.findAll({ where: { status: 'active', paidUntil: { [Op.lte]: now } }, include: withRelations, limit: BATCH });
    for (const account of expired) {
      await this.safely('expire', account, async () => {
        const plan = account.plan;
        if (account.autoRenew && plan && (await use('wallet').balance(account.userId)) >= (await this.orders.price(plan, 1, account.userId, 'renew'))) {
          try {
            await this.orders.extend(account, plan, 1, account.userId);
            await hooks.doAction('hosting.account.renewed', { account, months: 1, automatic: true });
            return;
          } catch {
            // Баланс змінився між перевіркою й списанням — блокуємо нижче
          }
        }
        await this.accounts.setStatus(account.id, 'suspend', { reason: 'billing' });
      });
    }
  }

  /** Оплачено, але панель не розблокувала одразу — повторити */
  private async resumePaid(now: Date): Promise<void> {
    const paid = await HostingAccount.findAll({ where: { status: 'suspended', suspendReason: 'billing', paidUntil: { [Op.gt]: now } }, limit: BATCH });
    for (const account of paid) await this.safely('resume', account, async () => void (await this.accounts.setStatus(account.id, 'resume')));
  }

  /** Лише якщо HOSTING_DELETE_AFTER_DAYS > 0: видалити в панелі давно заблоковані за несплату */
  private async purge(now: Date): Promise<void> {
    if (!this.config.deleteAfterDays) return;
    const old = await HostingAccount.findAll({
      where: { status: 'suspended', suspendReason: 'billing', paidUntil: { [Op.lte]: addDays(now, -this.config.deleteAfterDays) } },
      limit: BATCH,
    });
    for (const account of old) await this.safely('purge', account, () => this.accounts.remove(account.id, true));
  }

  async run(): Promise<void> {
    if (this.running || !isEnabled('hosting')) return;
    this.running = true;
    try {
      const now = new Date();
      await this.reconcilePending();
      await this.remind(now);
      await this.expire(now);
      await this.resumePaid(now);
      await this.purge(now);
      // Копія даних панелей (обʼєкти, використання, IP серверів) — після змін стану акаунтів
      await this.sync.syncAll();
      // Ліміти тарифів — з їхніх шаблонів панелі (оновлених синхронізацією)
      await this.plans.applyTemplates();
    } catch (error) {
      console.error('[hosting] фонове завдання', error);
    } finally {
      this.running = false;
    }
  }

  start(): void {
    setTimeout(() => void this.run(), 30_000).unref();
    setInterval(() => void this.run(), this.config.jobIntervalMinutes * 60_000).unref();
  }
}
