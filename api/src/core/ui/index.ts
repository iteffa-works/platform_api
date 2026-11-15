/**
 * Реєстр сторінок плагінів (server-driven UI): меню, сервіси, маршрути й рендер сторінок.
 * Тексти перекладаються на сервері мовою запиту; web лише малює схему.
 */
import type { Request } from 'express';
import { can, type Permissions } from '../access/index.js';
import type { Inline, UiMessages, UiNavItem, UiNode, UiRendered, UiService } from './schema.js';

export type * from './schema.js';

export type Language = 'uk' | 'en' | 'ru';

export type UiContext = {
  req: Request;
  userId: number;
  lang: Language;
  /** Параметри шляху: `/app/hosting/[id]` → `{ id }` */
  params: Record<string, string>;
  /** Значення живої форми (перерендер) та query */
  state: Record<string, string>;
  /** Переклад ключа плагіна з параметрами `{name}` */
  t: (key: string, params?: Record<string, string | number>) => string;
  can: (resource: string, level: 'view' | 'edit' | 'manage') => boolean;
};

export type UiPage = {
  /** Шлях web; параметри — `[id]` */
  path: string;
  section: 'admin' | 'cabinet';
  /** Ключі перекладів плагіна для заголовка шаблону */
  title: string;
  subtitle?: string;
  permission?: UiNavItem['permission'];
  /** Вузли сторінки; `{ nodes, actions }` — ще й кнопки в шапці сторінки */
  render: (ctx: UiContext) => Promise<UiNode[] | UiRendered>;
};

export type PluginUi = {
  messages: UiMessages;
  nav?: UiNavItem[];
  services?: UiService[];
  pages: UiPage[];
};

type Entry = { plugin: string; ui: PluginUi; patterns: Array<{ regex: RegExp; names: string[]; page: UiPage }> };

const entries = new Map<string, Entry>();

function compile(path: string): { regex: RegExp; names: string[] } {
  const names: string[] = [];
  const source = path.split('/').map((part) => {
    const match = part.match(/^\[(\w+)\]$/);
    if (match) {
      names.push(match[1]!);
      return '([^/]+)';
    }
    return part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }).join('/');
  return { regex: new RegExp(`^${source}$`), names };
}

export function registerUi(plugin: string, ui: PluginUi): void {
  const patterns = ui.pages
    // Точні шляхи раніше за шаблони з параметрами
    .slice()
    .sort((left, right) => Number(left.path.includes('[')) - Number(right.path.includes('[')))
    .map((page) => ({ ...compile(page.path), page }));
  entries.set(plugin, { plugin, ui, patterns });
}

function format(template: string, params?: Record<string, string | number>): string {
  return params ? template.replace(/\{(\w+)\}/g, (_m, name: string) => String(params[name] ?? `{${name}}`)) : template;
}

export function translator(messages: UiMessages, lang: Language) {
  return (key: string, params?: Record<string, string | number>) =>
    format(messages[lang]?.[key] ?? messages.uk[key] ?? key, params);
}

/** Спільні каталоги ядра web (журнал, сповіщення, ресурси ролей) — ключі без префікса плагіна */
const SHARED = ['activity.', 'notification.', 'resource.'];

function allowed(permissions: Permissions | null, permission?: UiNavItem['permission']): boolean {
  if (!permission) return true;
  return Boolean(permissions) && can(permissions!, permission[0], permission[1]);
}

/**
 * Маніфест для web: меню, сервіси, маршрути й переклади ключів (лише увімкнені плагіни й дозволене).
 * Ключі плагіна в перекладах — `<плагін>:<ключ>`.
 */
export function manifest(enabled: (plugin: string) => boolean, permissions: Permissions | null, lang: Language) {
  const result = {
    pages: [] as Array<{ path: string; plugin: string; section: string; title: string; subtitle?: string; permission?: UiNavItem['permission'] }>,
    nav: [] as Array<UiNavItem & { plugin: string }>,
    services: [] as Array<UiService & { plugin: string }>,
    messages: {} as Record<string, string>,
  };
  for (const { plugin, ui } of entries.values()) {
    if (!enabled(plugin)) continue;
    const t = translator(ui.messages, lang);
    for (const key of Object.keys(ui.messages.uk)) {
      result.messages[SHARED.some((prefix) => key.startsWith(prefix)) ? key : `${plugin}:${key}`] = t(key);
    }
    if (!permissions) continue;
    const ns = (key?: string) => (key ? `${plugin}:${key}` : undefined);
    for (const page of ui.pages) {
      if (!allowed(permissions, page.permission)) continue;
      result.pages.push({ path: page.path, plugin, section: page.section, title: ns(page.title)!, subtitle: ns(page.subtitle), permission: page.permission });
    }
    for (const item of ui.nav ?? []) {
      if (allowed(permissions, item.permission)) result.nav.push({ ...item, plugin, label: ns(item.label)!, group: ns(item.group) });
    }
    for (const service of ui.services ?? []) {
      if (allowed(permissions, service.permission)) result.services.push({ ...service, plugin, label: ns(service.label)! });
    }
  }
  return result;
}

/** Сторінка за шляхом серед увімкнених плагінів */
export function matchPage(path: string, enabled: (plugin: string) => boolean) {
  const normalized = path !== '/' ? path.replace(/\/$/, '') : '/';
  for (const entry of entries.values()) {
    if (!enabled(entry.plugin)) continue;
    for (const { regex, names, page } of entry.patterns) {
      const match = normalized.match(regex);
      if (match) {
        const params = Object.fromEntries(names.map((name, index) => [name, decodeURIComponent(match[index + 1]!)]));
        return { plugin: entry.plugin, ui: entry.ui, page, params };
      }
    }
  }
  return null;
}

/* ---------- Невеликі конструктори вузлів (читабельність сторінок) ---------- */

export const ui = {
  text: (text: Inline, extra: Partial<Extract<UiNode, { type: 'text' }>> = {}): UiNode => ({ type: 'text', text, ...extra }),
  muted: (text: Inline): UiNode => ({ type: 'text', text, tone: 'muted', size: 'sm' }),
  panel: (title: string | undefined, children: UiNode[], flush = false): UiNode => ({ type: 'panel', title, flush, children }),
  row: (children: UiNode[], justify: 'start' | 'between' | 'end' = 'start'): UiNode => ({ type: 'row', justify, children }),
  stack: (children: UiNode[], gap = 4): UiNode => ({ type: 'stack', gap, children }),
  badge: (text: string, tone: Extract<UiNode, { type: 'badge' }>['tone'] = 'slate'): UiNode => ({ type: 'badge', text, tone }),
  money: (amount: string, currency: string) => ({ type: 'money' as const, amount, currency }),
  date: (value: string | Date) => ({ type: 'date' as const, value }),
};
