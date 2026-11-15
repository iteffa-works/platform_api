/**
 * Реєстр конструктора: сторінки, блоки й навігація модулів ядра (`$lib/plugins`).
 * Плагіни (addon) коду в web не мають: їхні сторінки, меню й сервіси приходять з API (remote/manifest),
 * а рендерить їх блок `remote.page` за схемою.
 */
import type { TextKey } from '$lib/i18n';
import { plugins } from '$lib/plugins';
import type { IconName } from '$lib/ui/elements';
import type { RemoteNavItem, RemotePageRef } from './remote/manifest.js';
import RemotePage from './remote/RemotePage.svelte';
import { sectionLoad, setSectionLoad } from './sections.js';
import type { BlockComponent, BlockRef, RegisteredNavItem, RegisteredPage } from './types.js';

const blocks = new Map<string, BlockComponent>([['remote.page', RemotePage]]);
const pages: RegisteredPage[] = [];
const nav = new Map<string, RegisteredNavItem[]>();
const header = new Map<string, BlockRef[]>();

for (const plugin of plugins) {
  for (const [id, component] of Object.entries(plugin.blocks ?? {})) {
    if (blocks.has(id)) throw new Error(`Блок «${id}» оголошено двічі`);
    blocks.set(id, component);
  }
  for (const page of plugin.pages ?? []) {
    if (pages.some((item) => item.path === page.path)) throw new Error(`Шлях «${page.path}» оголошено двічі`);
    pages.push({ ...page, plugin: plugin.name, section: page.section ?? plugin.name, addon: false });
  }
  for (const item of plugin.nav ?? []) {
    const section = item.section ?? plugin.name;
    nav.set(section, [...(nav.get(section) ?? []), { ...item, plugin: plugin.name }]);
  }
  header.set(plugin.name, plugin.header ?? []);
  if (plugin.sectionLoad) setSectionLoad(plugin.name, plugin.sectionLoad);
}

/** Компонент блоку за id */
export function getBlock(id: string): BlockComponent {
  const component = blocks.get(id);
  if (!component) throw new Error(`Блок «${id}» не знайдено`);
  return component;
}

/** Сторінка ядра за шляхом */
export function findPage(path: string): RegisteredPage | undefined {
  const normalized = path !== '/' ? path.replace(/\/$/, '') : '/';
  return pages.find((page) => page.path === normalized);
}

/** Сторінка плагіна з маніфесту → сторінка конструктора (шаблон розділу + блок remote.page) */
export function remotePage(ref: RemotePageRef): RegisteredPage {
  return {
    id: `remote:${ref.path}`,
    path: ref.path,
    access: 'user',
    permission: ref.permission,
    template: ref.section,
    title: ref.title as TextKey,
    subtitle: ref.subtitle as TextKey | undefined,
    section: ref.section,
    plugin: ref.plugin,
    addon: true,
    load: sectionLoad(ref.section),
    slots: { default: [{ block: 'remote.page', props: { section: ref.section } }] },
  };
}

/** Навігація розділу: ядро + пункти плагінів з маніфесту (без фільтра прав) */
export function navOf(section: string, remote: RemoteNavItem[] = []): RegisteredNavItem[] {
  const fromPlugins = remote
    .filter((item) => item.section === section)
    .map((item): RegisteredNavItem => ({
      href: item.href,
      label: item.label as TextKey,
      icon: item.icon as IconName | undefined,
      group: item.group as TextKey | undefined,
      pinned: item.pinned,
      permission: item.permission,
      section,
      plugin: item.plugin,
    }));
  return [...(nav.get(section) ?? []), ...fromPlugins];
}

/** Блоки шапки розділу */
export function headerOf(section: string): BlockRef[] {
  return header.get(section) ?? [];
}
