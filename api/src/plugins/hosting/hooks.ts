/**
 * Хуки хостингу: типи (declaration merging у core/hooks) і підписники за замовчуванням.
 *
 * Сервіси лише оголошують подію (`hooks.doAction('hosting.account.created', …)`) — побічні ефекти
 * (журнал дій, сповіщення, у майбутньому — CRM, вебхуки, інші модулі) підписуються тут або в інших плагінах.
 * Фільтри дають змінити дані без правок сервісу: ціна замовлення, каталог, подання акаунта.
 */
import type { Request } from 'express';
import { track } from '../../core/activity/index.js';
import { hooks } from '../../core/hooks/index.js';
import { isEnabled } from '../../core/plugins/index.js';
import { registerNotification } from '../../modules/notifications/index.js';
import type { HostingAccount, HostingPlan } from './domain/models.js';

type Actor = { req?: Request | null; actorId?: number | null };
type AccountEvent = Actor & { account: HostingAccount };

/** Розділ консолі панелі, у якому змінено обʼєкт */
export type PanelSection = 'accounts' | 'sites' | 'dns' | 'mail' | 'databases' | 'ftp' | 'cron';

declare module '../../core/hooks/index.js' {
  interface HookActions {
    'hosting.account.created': AccountEvent & { source: 'order' | 'admin' };
    'hosting.account.renewed': AccountEvent & { months: number; automatic: boolean };
    'hosting.account.plan_changed': AccountEvent & { plan: HostingPlan; costCents: number };
    'hosting.account.suspended': AccountEvent & { reason: 'admin' | 'billing' };
    'hosting.account.resumed': AccountEvent;
    'hosting.account.deleted': AccountEvent & { removeFromPanel: boolean };
    'hosting.account.updated': AccountEvent;
    'hosting.account.expiring': AccountEvent;
    'hosting.account.password_changed': AccountEvent;
    'hosting.account.panel_login': AccountEvent;
    /** Зміна в консолі панелі (адмінка): створення / видалення обʼєкта */
    'hosting.panel.changed': Actor & { serverId: number; section: PanelSection; action: 'create' | 'delete' | 'update'; name: string; client?: boolean };
  }
  interface HookFilters {
    /** Ціна замовлення / продовження в копійках (знижки, промокоди, акції) */
    'hosting.order.price': [cents: number, context: { plan: HostingPlan; months: number; userId: number; kind: 'order' | 'renew' }];
  }
}

const OWNER = 'hosting';
const when = () => isEnabled('hosting');
const date = (value: Date | null) => (value ? value.toISOString().slice(0, 10) : '');

/** Підписники за замовчуванням: журнал дій і сповіщення користувачу */
export function registerHostingSubscribers(): void {
  for (const [kind, keys] of Object.entries({
    'hosting.created': ['login'],
    'hosting.expiring': ['login', 'date', 'auto'],
    'hosting.renewed': ['login', 'date'],
    'hosting.expired': ['login'],
    'hosting.suspended': ['login'],
    'hosting.resumed': ['login'],
    'hosting.deleted': ['login'],
  })) {
    registerNotification(kind, keys);
  }

  const options = { owner: OWNER, when };
  const admin = (event: Actor, action: string, meta: Record<string, unknown>) =>
    event.actorId && event.req ? track(event.req, event.actorId, action, meta) : undefined;

  hooks.addAction('hosting.account.created', async (event) => {
    const { account } = event;
    await track(event.source === 'order' ? event.req ?? null : null, account.userId, 'hosting.created', { login: account.panelUser });
    if (event.source === 'admin') await admin(event, 'admin.hosting_created', { userId: account.userId, login: account.panelUser });
  }, options);

  hooks.addAction('hosting.account.renewed', (event) =>
    track(event.automatic ? null : event.req ?? null, event.account.userId, 'hosting.renewed', {
      login: event.account.panelUser, months: event.months, date: date(event.account.paidUntil),
    }), options);

  hooks.addAction('hosting.account.plan_changed', (event) =>
    track(event.req ?? null, event.account.userId, 'hosting.plan_changed', { login: event.account.panelUser, plan: event.plan.name }), options);

  hooks.addAction('hosting.account.suspended', async (event) => {
    const login = event.account.panelUser;
    await track(null, event.account.userId, event.reason === 'billing' ? 'hosting.expired' : 'hosting.suspended', { login });
    await admin(event, 'admin.hosting_suspended', { userId: event.account.userId, login });
  }, options);

  hooks.addAction('hosting.account.resumed', async (event) => {
    await track(null, event.account.userId, 'hosting.resumed', { login: event.account.panelUser });
    await admin(event, 'admin.hosting_resumed', { userId: event.account.userId, login: event.account.panelUser });
  }, options);

  hooks.addAction('hosting.account.deleted', async (event) => {
    const login = event.account.panelUser;
    const self = event.actorId === event.account.userId;
    await track(self ? event.req ?? null : null, event.account.userId, 'hosting.deleted', { login });
    if (!self) await admin(event, 'admin.hosting_deleted', { userId: event.account.userId, login, panel: event.removeFromPanel ? 'yes' : 'no' });
  }, options);

  hooks.addAction('hosting.account.updated', (event) =>
    admin(event, 'admin.hosting_updated', { userId: event.account.userId, login: event.account.panelUser }), options);

  hooks.addAction('hosting.account.expiring', (event) =>
    track(null, event.account.userId, 'hosting.expiring', {
      login: event.account.panelUser, date: date(event.account.paidUntil), auto: event.account.autoRenew ? 'yes' : 'no',
    }), options);

  hooks.addAction('hosting.account.password_changed', (event) =>
    track(event.req ?? null, event.account.userId, 'hosting.password_changed', { login: event.account.panelUser }), options);

  hooks.addAction('hosting.account.panel_login', (event) =>
    track(event.req ?? null, event.account.userId, 'hosting.panel_login', { login: event.account.panelUser }), options);

  // Консоль адміністратора — admin.hosting_panel; кабінет клієнта — hosting.panel_changed у його журналі
  hooks.addAction('hosting.panel.changed', (event) => {
    const meta = { server: event.serverId, section: event.section, action: event.action, name: event.name };
    if (event.client) return event.actorId ? track(event.req ?? null, event.actorId, 'hosting.panel_changed', meta) : undefined;
    return admin(event, 'admin.hosting_panel', meta);
  }, options);
}
