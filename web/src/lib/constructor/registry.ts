/**
 * Реєстр конструктора: сторінки, блоки й навігація з усіх web-плагінів.
 * Ядро — `$lib/plugins`; addon — `src/plugins/<name>/index.ts` (автовиявлення).
 */
import { registerMessages } from '$lib/i18n';
import { plugins as corePlugins } from '$lib/plugins';
import type { BlockComponent, BlockRef, RegisteredNavItem, RegisteredPage, WebPlugin } from './types.js';

// Відносний шлях: абсолютний `/src/...` на Windows ламається через регістр літери диска
const addonModules = import.meta.glob<{ plugin?: WebPlugin }>('../../plugins/*/index.ts', { eager: true });

const blocks = new Map<string, BlockComponent>();
const pages: RegisteredPage[] = [];
const nav = new Map<string, RegisteredNavItem[]>();
const header = new Map<string, BlockRef[]>();
const addons = new Set<string>();
const names = new Set<string>();

function register(plugin: WebPlugin, addon: boolean): void {
  if (names.has(plugin.name)) throw new Error(`Web-плагін «${plugin.name}» оголошено двічі`);
  names.add(plugin.name);
  if (addon) addons.add(plugin.name);
  if (plugin.messages) registerMessages(plugin.name, plugin.messages);

  for (const [id, component] of Object.entries(plugin.blocks ?? {})) {
    if (blocks.has(id)) throw new Error(`Блок «${id}» оголошено двічі`);
    blocks.set(id, component);
  }
  for (const page of plugin.pages ?? []) {
    if (pages.some((item) => item.path === page.path)) throw new Error(`Шлях «${page.path}» оголошено двічі`);
    pages.push({ ...page, plugin: plugin.name, section: page.section ?? plugin.name, addon });
  }
  for (const item of plugin.nav ?? []) {
    const section = item.section ?? plugin.name;
    nav.set(section, [...(nav.get(section) ?? []), { ...item, plugin: plugin.name }]);
  }
  header.set(plugin.name, plugin.header ?? []);
}

for (const plugin of corePlugins) register(plugin, false);
for (const [file, mod] of Object.entries(addonModules)) {
  if (!mod.plugin?.name) throw new Error(`${file}: немає export const plugin`);
  register(mod.plugin, true);
}

/** Чи діє плагін: ядро — завжди, addon — якщо увімкнено в API */
export function isPluginActive(plugin: string, enabled: ReadonlySet<string>): boolean {
  return !addons.has(plugin) || enabled.has(plugin);
}

/** Компонент блоку за id */
export function getBlock(id: string): BlockComponent {
  const component = blocks.get(id);
  if (!component) throw new Error(`Блок «${id}» не знайдено`);
  return component;
}

/** Сторінка за шляхом */
export function findPage(path: string): RegisteredPage | undefined {
  const normalized = path !== '/' ? path.replace(/\/$/, '') : '/';
  return pages.find((page) => page.path === normalized);
}

/** Навігація розділу (без фільтра прав); пункти вимкнених addon — приховано */
export function navOf(section: string, enabled: ReadonlySet<string> = new Set()): RegisteredNavItem[] {
  return (nav.get(section) ?? []).filter((item) => isPluginActive(item.plugin, enabled));
}

/** Блоки шапки розділу */
export function headerOf(section: string): BlockRef[] {
  return header.get(section) ?? [];
}
