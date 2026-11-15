import type { LayoutServerLoad } from './$types';

/** Мова з cookie (hooks.server) — для SSR потрібною мовою */
export const load: LayoutServerLoad = ({ locals }) => ({ locale: locals.locale });
