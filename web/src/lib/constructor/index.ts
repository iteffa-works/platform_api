/** Конструктор екранів: сторінки й блоки з web-плагінів */
export { guardAccess } from './guard.js';
export { enabledAddons, loadAddons } from './addons.js';
export { findPage } from './registry.js';
export type { NavItem, PageDefinition, RegisteredPage, WebPlugin } from './types.js';
export { default as PageHost } from './PageHost.svelte';
