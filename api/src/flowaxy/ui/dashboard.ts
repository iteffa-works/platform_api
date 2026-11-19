/**
 * Панелі-огляди (адмінка, кабінет), які складаються з внесків плагінів через фільтр `ui.dashboard`.
 * Сторінка огляду збирає внески: `collectDashboard(ctx, 'admin')`; плагін додає свій:
 *
 * ```ts
 * hooks.addFilter('ui.dashboard', async (sections, { ctx, area }) => {
 *   if (area !== 'admin' || !ctx.can('users', 'view')) return sections;
 *   const t = withMessages(ctx, messages);           // тексти — зі словника плагіна
 *   return [...sections, { order: 10, stats: [...], panels: [...] }];
 * }, { owner: 'auth', when: () => isEnabled('auth') });
 * ```
 */
import { hooks } from '../hooks/index.js';
import type { UiContext } from './index.js';
import { translator } from './index.js';
import type { UiMessages, UiNode } from './schema.js';

export type DashboardStat = Extract<UiNode, { type: 'stats' }>['items'][number];
export type DashboardShortcut = Extract<UiNode, { type: 'shortcuts' }>['items'][number];

/**
 * Внесок плагіна в огляд; `order` — менший раніше:
 * alerts — повідомлення вгорі, stats — показники, shortcuts — швидкі дії, panels — основна колонка, aside — вузька колонка праворуч.
 */
export type DashboardSection = { order: number; alerts?: UiNode[]; stats?: DashboardStat[]; shortcuts?: DashboardShortcut[]; panels?: UiNode[]; aside?: UiNode[] };

export type DashboardArea = 'admin' | 'cabinet';

declare module '../hooks/index.js' {
  interface HookFilters {
    'ui.dashboard': [sections: DashboardSection[], context: { ctx: UiContext; area: DashboardArea }];
  }
}

/** Внески плагінів, упорядковані */
export async function collectDashboard(ctx: UiContext, area: DashboardArea) {
  const sections = [...await hooks.applyFilters('ui.dashboard', [], { ctx, area })].sort((left, right) => left.order - right.order);
  return {
    alerts: sections.flatMap((section) => section.alerts ?? []),
    stats: sections.flatMap((section) => section.stats ?? []),
    shortcuts: sections.flatMap((section) => section.shortcuts ?? []),
    panels: sections.flatMap((section) => section.panels ?? []),
    aside: sections.flatMap((section) => section.aside ?? []),
  };
}

/** Той самий контекст, але з перекладами іншого словника (внесок плагіна в чужу сторінку) */
export function withMessages(ctx: UiContext, messages: UiMessages): UiContext {
  return { ...ctx, t: translator(messages, ctx.lang) };
}
