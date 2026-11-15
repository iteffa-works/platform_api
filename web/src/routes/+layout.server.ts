import type { LayoutServerLoad } from './$types';

/** Мова з cookie (hooks.server) — для SSR потрібною мовою; hasSession — чи є cookie сесії */
export const load: LayoutServerLoad = ({ locals }) => ({ locale: locals.locale, hasSession: locals.hasSession });
