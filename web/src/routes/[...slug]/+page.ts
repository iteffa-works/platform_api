import { browser } from '$app/environment';
import { error, redirect } from '@sveltejs/kit';
import { findPage, guardAccess } from '$lib/constructor';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
  const page = findPage(`/${params.slug}`);
  if (!page) throw error(404, 'Сторінку не знайдено');

  // Токен сесії в localStorage — захищені сторінки перевіряються лише в браузері.
  // Прибрати після переходу сесії на cookie (доопрацювання AUTH).
  if (!browser && page.access !== 'public') return { page, ready: false };

  const access = await guardAccess(page);
  if (!access.ok) throw redirect(302, access.redirect);

  await page.load?.();
  return { page, ready: true };
};
