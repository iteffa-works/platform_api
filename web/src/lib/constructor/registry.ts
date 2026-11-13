/** Реєстр блоків конструктора */
import type { BlockComponent } from './types.js';

const blocks = new Map<string, BlockComponent>();

/** Зареєструвати UI-блок (повторний виклик безпечний для HMR) */
export function registerBlock(id: string, component: BlockComponent): void {
  blocks.set(id, component);
}

/** Отримати компонент блоку */
export function getBlock(id: string): BlockComponent {
  const component = blocks.get(id);
  if (!component) throw new Error(`Блок «${id}» не знайдено`);
  return component;
}
