import { error, redirect } from '@sveltejs/kit';
import { registerAllBlocks } from '$lib/blocks/register';
import { findPage, guardAccess } from '$lib/constructor';
import { loadAccounts } from '$lib/domain/accounts';
import { loadAdminUsers } from '$lib/domain/admin';
import type { PageLoad } from './$types';

registerAllBlocks();

function pathFromSlug(slug?: string | string[]): string {
  if (!slug || (Array.isArray(slug) && slug.length === 0) || slug === '') return '/';
  const parts = Array.isArray(slug) ? slug : slug.split('/').filter(Boolean);
  return parts.length ? `/${parts.join('/')}` : '/';
}

export const load: PageLoad = async ({ params }) => {
  const path = pathFromSlug(params.slug as string | string[] | undefined);
  const page = findPage(path);
  if (!page) throw error(404, 'Сторінку не знайдено');

  const access = await guardAccess(page.access);
  if (!access.ok) throw redirect(302, access.redirect);

  if (page.id === 'cabinet') await loadAccounts();
  if (page.id === 'admin') await loadAdminUsers();

  return { page };
};
