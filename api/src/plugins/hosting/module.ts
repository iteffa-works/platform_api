/**
 * Корінь композиції плагіна: створює й звʼязує сервіси (явні залежності через конструктори).
 * Маршрути (http/) і сторінки (ui/) отримують готові сервіси звідси — без глобальних функцій і дублів.
 */
import { HostingConfig } from './config.js';
import { createProviderRegistry, type ProviderRegistry } from './providers/registry.js';
import { AccountService } from './services/account.service.js';
import { LifecycleService } from './services/lifecycle.service.js';
import { MirrorService } from './services/mirror.service.js';
import { OrderService } from './services/order.service.js';
import { PlanService } from './services/plan.service.js';
import { ResourceService } from './services/resource.service.js';
import { ServerService } from './services/server.service.js';
import { SyncService } from './services/sync.service.js';

export class HostingModule {
  readonly config: HostingConfig;
  readonly providers: ProviderRegistry;
  /** Копія даних панелей у БД і її синхронізація */
  readonly mirror: MirrorService;
  readonly sync: SyncService;
  readonly servers: ServerService;
  readonly plans: PlanService;
  readonly accounts: AccountService;
  readonly orders: OrderService;
  /** Ресурси акаунта в кабінеті (сайти, DNS, пошта, …) */
  readonly resources: ResourceService;
  readonly lifecycle: LifecycleService;

  constructor(config = new HostingConfig(), providers = createProviderRegistry()) {
    this.config = config;
    this.providers = providers;
    this.mirror = new MirrorService();
    this.servers = new ServerService(providers, this.mirror);
    this.sync = new SyncService(this.servers, this.mirror);
    this.plans = new PlanService(this.mirror);
    this.accounts = new AccountService(this.servers, this.sync);
    this.orders = new OrderService(this.servers, this.plans, this.accounts, this.sync, config);
    this.resources = new ResourceService(this.servers, this.mirror, this.sync);
    this.lifecycle = new LifecycleService(config, this.servers, this.accounts, this.orders, this.sync, this.plans);
  }
}

/** Екземпляр плагіна */
export const hosting = new HostingModule();
