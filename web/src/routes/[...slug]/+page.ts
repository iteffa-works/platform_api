import { error, redirect } from '@sveltejs/kit';
import { findPage, guardAccess } from '$lib/constructor';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
  const page = findPage(`/${params.slug}`);
  if (!page) throw error(404, 'Сторінку не знайдено');

  const access = await guardAccess(page.access);
  if (!access.ok) throw redirect(302, access.redirect);

  await page.load?.();
  return { page };
};
