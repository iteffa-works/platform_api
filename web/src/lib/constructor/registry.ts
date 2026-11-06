/** Реєстр блоків конструктора */
import type { BlockComponent } from './types.js';

const blocks = new Map<string, BlockComponent>();

/** Зареєструвати UI-блок за id */
export function registerBlock(id: string, component: BlockComponent): void {
  if (blocks.has(id)) throw new Error(`Блок «${id}» уже зареєстровано`);
  blocks.set(id, component);
}

/** Отримати компонент блоку */
export function getBlock(id: string): BlockComponent {
  const component = blocks.get(id);
  if (!component) throw new Error(`Блок «${id}» не знайдено`);
  return component;
}

/** Список id блоків (для дебагу) */
export function listBlocks(): string[] {
  return [...blocks.keys()].sort();
}
