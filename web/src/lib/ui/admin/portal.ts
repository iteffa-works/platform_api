/**
 * Слот дій у шапці сторінки шаблону. Вміст рендерить сама сторінка (у своєму контексті — дії, діалоги),
 * а `portal` переносить DOM у слот. Шаблон один на сторінку, тож достатньо store.
 */
import { writable } from 'svelte/store';

export const headerSlot = writable<HTMLElement | null>(null);

/** Svelte-action: зареєструвати елемент як слот дій шапки */
export function headerTarget(node: HTMLElement) {
  headerSlot.set(node);
  return {
    destroy() {
      headerSlot.update((current) => (current === node ? null : current));
    },
  };
}

/** Svelte-action: перенести елемент у target (немає target — лишити на місці) */
export function portal(node: HTMLElement, target: HTMLElement | null) {
  const home = node.parentNode;
  const anchor = node.nextSibling;

  function move(next: HTMLElement | null) {
    if (next) next.appendChild(node);
    else if (home && node.parentNode !== home) home.insertBefore(node, anchor);
  }

  move(target);
  return {
    update: move,
    destroy() {
      node.remove();
    },
  };
}
