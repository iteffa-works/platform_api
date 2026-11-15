/** Подання моделей для API / сторінок: без секретів і службових полів */
import { formatAmount } from '../../../modules/billing/money.js';
import type { HostingAccount, HostingPlan, HostingServer } from '../domain/models.js';

export function presentPlan(plan: HostingPlan) {
  return {
    id: plan.id,
    slug: plan.slug,
    name: plan.name,
    description: plan.description,
    price: formatAmount(plan.priceCents),
    priceCents: plan.priceCents,
    package: plan.package,
    diskMb: plan.diskMb,
    sites: plan.sites,
    isActive: plan.isActive,
    sortOrder: plan.sortOrder,
  };
}

export type PlanView = ReturnType<typeof presentPlan>;

export function splitIps(value: string | null): string[] {
  return (value ?? '').split(/[\s,]+/).filter(Boolean);
}

/** Розташування для користувача: без логіна адміністратора панелі */
export function presentLocation(server: HostingServer) {
  return { name: server.name, location: server.location, ipv4: splitIps(server.ipv4), ipv6: splitIps(server.ipv6), url: server.url };
}

/** Сервер для адмінки: без пароля (лише ознака) */
export function presentServer(server: HostingServer, accounts = 0) {
  return {
    id: server.id,
    provider: server.provider,
    name: server.name,
    url: server.url,
    username: server.username,
    verifyTls: server.verifyTls,
    isActive: server.isActive,
    isPublic: server.isPublic,
    defaultPreset: server.defaultPreset,
    location: server.location,
    ipv4: server.ipv4,
    ipv6: server.ipv6,
    maxAccounts: server.maxAccounts,
    accounts,
  };
}

export type ServerView = ReturnType<typeof presentServer>;

export function presentAccount(account: HostingAccount, admin = false) {
  return {
    id: account.id,
    login: account.panelUser,
    status: account.status,
    suspendReason: account.suspendReason,
    paidUntil: account.paidUntil,
    autoRenew: account.autoRenew,
    note: account.note,
    package: account.preset,
    plan: account.plan ? presentPlan(account.plan) : null,
    usage: {
      diskUsedMb: account.diskUsedMb,
      diskLimitMb: account.diskLimitMb ?? account.plan?.diskMb ?? null,
      sitesUsed: account.sitesUsed,
      sitesLimit: account.sitesLimit ?? account.plan?.sites ?? null,
      updatedAt: account.usageAt,
    },
    server: account.server ? presentLocation(account.server) : null,
    createdAt: account.createdAt,
    deletedAt: account.deletedAt,
    ...(admin ? {
      serverId: account.serverId,
      user: account.user ? { id: account.user.id, email: account.user.email } : null,
    } : {}),
  };
}

export type AccountView = ReturnType<typeof presentAccount>;

/** Ціна в копійках → «150.00» */
export const money = formatAmount;
