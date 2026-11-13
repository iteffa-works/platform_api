/** Конструктор екранів: каталог сторінок + реєстр блоків */
export { guardAccess } from './guard.js';
export { findPage, pages } from './pages.js';
export { getBlock, registerBlock } from './registry.js';
export type { AccessLevel, BlockRef, PageDefinition, TemplateId } from './types.js';
export { default as PageHost } from './PageHost.svelte';
