import { browser } from '$app/environment';
import { error, redirect } from '@sveltejs/kit';
import { findPage, guardAccess, loadAddons } from '$lib/constructor';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
  const page = findPage(`/${params.slug}`);
  if (!page) throw error(404, 'Сторінку не знайдено');

  // Захищені сторінки й сторінки addon перевіряються лише в браузері (стан — модульні store)
  if (!browser && (page.access !== 'public' || page.addon)) return { page, ready: false };

  // Стан addon потрібен і для меню core-сторінок; недоступний API — addon вважаються вимкненими
  const enabled = browser ? await loadAddons().catch(() => new Set<string>()) : new Set<string>();
  if (page.addon && !enabled.has(page.plugin)) throw error(404, 'Сторінку не знайдено');

  const access = await guardAccess(page);
  if (!access.ok) throw redirect(302, access.redirect);

  await page.load?.();
  return { page, ready: true };
};
