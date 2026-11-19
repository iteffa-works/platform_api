/**
 * Вітрина хостингу для головної: тарифи з адмінки (з лімітами шаблонів панелі) — `GET /public/hosting/plans`.
 * Один запит на сторінку (спільний store для блоків); плагін хостингу вимкнено — `null`, блоки тарифів ховаються.
 */
import { get, writable } from 'svelte/store';
import { api } from '$lib/core/api';
import { isAuthenticated } from '$lib/domain/auth';

export type ShowcasePlan = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  price: string;
  featured: boolean;
  diskMb: number | null;
  sites: number | null;
  databases: number | null;
  mailboxes: number | null;
  mailDomains: number | null;
  ftpUsers: number | null;
  cronJobs: number | null;
  features: { backup: boolean; ssh: boolean; nodejs: boolean; git: boolean; ssl: boolean } | null;
};

export type Showcase = { currency: string; periods: number[]; plans: ShowcasePlan[]; locations: string[] };

/** undefined — завантажується, null — недоступно */
export const showcase = writable<Showcase | null | undefined>(undefined);

let started = false;

export function loadShowcase(): void {
  if (started) return;
  started = true;
  api<Showcase>('/public/hosting/plans')
    .then((data) => showcase.set(data.plans.length ? data : null))
    .catch(() => showcase.set(null));
}

/** Безкоштовний тариф */
export const isFree = (plan: ShowcasePlan) => Number(plan.price) === 0;

/** Замовлення з вибраним тарифом і строком; гість — спершу реєстрація, потім одразу форма замовлення */
export function orderHref(plan: ShowcasePlan, months = 1): string {
  const target = `/app/hosting/order?planId=${plan.id}${months > 1 ? `&months=${months}` : ''}`;
  return get(isAuthenticated) ? target : `/register?next=${encodeURIComponent(target)}`;
}

/** МБ → «500 MB» / «20 GB»; null — без обмеження */
export function size(mb: number | null): string | null {
  if (mb === null) return null;
  if (mb >= 1024) {
    const gb = mb / 1024;
    return `${Number.isInteger(gb) ? gb : gb.toFixed(1)} GB`;
  }
  return `${Math.round(mb)} MB`;
}

/** Найнижча ціна платного тарифу (для «від … грн») */
export function lowestPaid(data: Showcase): ShowcasePlan | null {
  return data.plans.filter((plan) => !isFree(plan)).sort((left, right) => Number(left.price) - Number(right.price))[0] ?? null;
}
