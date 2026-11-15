/** Реєстр конструктора: сторінки, блоки й навігація з усіх web-плагінів */
import { plugins } from '$lib/plugins';
import type { BlockComponent, BlockRef, NavItem, RegisteredPage } from './types.js';

const blocks = new Map<string, BlockComponent>();
const pages: RegisteredPage[] = [];
const nav = new Map<string, NavItem[]>();
const header = new Map<string, BlockRef[]>();

for (const plugin of plugins) {
  for (const [id, component] of Object.entries(plugin.blocks ?? {})) {
    if (blocks.has(id)) throw new Error(`Блок «${id}» оголошено двічі`);
    blocks.set(id, component);
  }
  for (const page of plugin.pages ?? []) {
    if (pages.some((item) => item.path === page.path)) throw new Error(`Шлях «${page.path}» оголошено двічі`);
    pages.push({ ...page, plugin: plugin.name });
  }
  nav.set(plugin.name, plugin.nav ?? []);
  header.set(plugin.name, plugin.header ?? []);
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

/** Навігація плагіна (без фільтра прав) */
export function navOf(plugin: string): NavItem[] {
  return nav.get(plugin) ?? [];
}

/** Блоки шапки плагіна */
export function headerOf(plugin: string): BlockRef[] {
  return header.get(plugin) ?? [];
}
