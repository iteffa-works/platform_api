import { browser } from '$app/environment';
import { error, redirect } from '@sveltejs/kit';
import { get } from 'svelte/store';
import { findPage, guardAccess, loadManifest, matchRemote, remotePage, type RegisteredPage } from '$lib/constructor';
import { apiLanguage } from '$lib/core/api';
import { ensureAuth, user } from '$lib/domain/auth';
import { isLocale, DEFAULT_LOCALE } from '$lib/i18n';
import type { PageLoad } from './$types';

const locale = () => {
  const value = apiLanguage();
  return isLocale(value) ? value : DEFAULT_LOCALE;
};

/**
 * Сторінка ядра (реєстр web) або плагіна (маніфест API → схема).
 * Захищені й сторінки плагінів перевіряються лише в браузері (стан користувача — модульні store).
 */
export const load: PageLoad = async ({ params, url, parent }) => {
  const path = `/${params.slug}`;
  let page: RegisteredPage | undefined = findPage(path);

  if (!browser) {
    // Вхід / реєстрація з cookie сесії: рішення — у браузері (сесія може бути дійсна → кабінет), без мерехтіння форми
    if (page?.access === 'guest' && !(await parent()).hasSession) {
      return { page, ready: true };
    }
    if (page?.access === 'public') {
      await page.load?.();
      return { page, ready: true };
    }
    return { page: page ?? null, ready: false };
  }

  if (!page) {
    // Сторінки плагінів — лише в кабінеті / адмінці; гостю — вхід, інше — 404
    if (!(await ensureAuth())) {
      if (/^\/(app|admin)(\/|$)/.test(path)) throw redirect(302, `/login?next=${encodeURIComponent(`${url.pathname}${url.search}`)}`);
      throw error(404, 'Сторінку не знайдено');
    }
    const ref = matchRemote(await loadManifest(locale(), get(user)?.id ?? null), path);
    if (!ref) throw error(404, 'Сторінку не знайдено');
    page = remotePage(ref);
  }

  const access = await guardAccess(page, url);
  if (!access.ok) throw redirect(302, access.redirect);

  await page.load?.();
  return { page, ready: true };
};
