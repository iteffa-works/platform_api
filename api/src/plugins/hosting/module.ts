/**
 * Корінь композиції плагіна: створює й звʼязує сервіси (явні залежності через конструктори).
 * Маршрути (http/) і сторінки (ui/) отримують готові сервіси звідси — без глобальних функцій і дублів.
 */
import { HostingConfig } from './config.js';
import { createProviderRegistry, type ProviderRegistry } from './providers/registry.js';
import { AccountService } from './services/account.service.js';
import { LifecycleService } from './services/lifecycle.service.js';
import { OrderService } from './services/order.service.js';
import { PanelService } from './services/panel.service.js';
import { PlanService } from './services/plan.service.js';
import { ServerService } from './services/server.service.js';

export class HostingModule {
  readonly config: HostingConfig;
  readonly providers: ProviderRegistry;
  readonly servers: ServerService;
  readonly plans: PlanService;
  readonly accounts: AccountService;
  readonly orders: OrderService;
  readonly panel: PanelService;
  readonly lifecycle: LifecycleService;

  constructor(config = new HostingConfig(), providers = createProviderRegistry()) {
    this.config = config;
    this.providers = providers;
    this.servers = new ServerService(providers);
    this.plans = new PlanService();
    this.accounts = new AccountService(this.servers, config);
    this.orders = new OrderService(this.servers, this.plans, this.accounts, config);
    this.panel = new PanelService(this.servers);
    this.lifecycle = new LifecycleService(config, this.servers, this.accounts, this.orders);
  }
}

/** Екземпляр плагіна */
export const hosting = new HostingModule();
