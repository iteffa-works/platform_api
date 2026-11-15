<script lang="ts">
  /** Меню дій рядка (⋯): пункти — кнопки схеми; закривається кліком поза меню, Esc або після вибору */
  import { onMount } from 'svelte';
  import type { UiButton } from './schema.js';
  import UiButtonNode from './UiButtonNode.svelte';

  let { items, label = '' }: { items: UiButton[]; label?: string } = $props();

  let open = $state(false);
  let root = $state<HTMLDivElement>();
  /** Відкривати вгору, якщо внизу вікна мало місця */
  let up = $state(false);

  function toggle() {
    if (!open) up = root!.getBoundingClientRect().bottom > window.innerHeight - 260;
    open = !open;
  }

  onMount(() => {
    const outside = (event: MouseEvent) => {
      if (open && !root?.contains(event.target as Node)) open = false;
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') open = false;
    };
    document.addEventListener('click', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('click', outside);
      document.removeEventListener('keydown', escape);
    };
  });
</script>

{#if items.length}
  <div class="menu" bind:this={root}>
    <button type="button" class="menu__trigger" class:is-open={open} aria-haspopup="menu" aria-expanded={open} aria-label={label || '⋯'} onclick={toggle}>
      <span aria-hidden="true">{label || '⋯'}</span>
    </button>
    <!-- Пункти змонтовані завжди: модальне вікно пункту переживає закриття меню -->
    <div class="menu__list" class:is-open={open} class:is-up={up} role="menu">
      {#each items as item, index (index)}
        <UiButtonNode node={item} className="menu__item" onpress={() => (open = false)} />
      {/each}
    </div>
  </div>
{/if}

<style>
  .menu {
    position: relative;
    display: inline-block;
  }

  .menu__trigger {
    display: grid;
    place-items: center;
    min-width: 32px;
    height: 32px;
    padding: 0 8px;
    border: 1px solid transparent;
    border-radius: 8px;
    background: none;
    color: var(--ui-muted);
    font: inherit;
    font-size: 18px;
    font-weight: 700;
    line-height: 1;
    cursor: pointer;
  }

  .menu__trigger:hover,
  .menu__trigger.is-open {
    border-color: var(--ui-border);
    background: var(--ui-surface-muted);
    color: var(--ui-text);
  }

  .menu__list {
    position: absolute;
    top: calc(100% + 4px);
    right: 0;
    z-index: 30;
    display: none;
    min-width: 220px;
    padding: 6px;
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius-md, 10px);
    background: var(--ui-surface);
    box-shadow: var(--ui-shadow-md, 0 12px 32px rgba(15, 23, 42, 0.16));
    text-align: left;
  }

  .menu__list.is-open {
    display: grid;
  }

  .menu__list.is-up {
    top: auto;
    bottom: calc(100% + 4px);
  }

  .menu__list :global(.menu__item) {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 8px 10px;
    border: 0;
    border-radius: 6px;
    background: none;
    color: var(--ui-text);
    font: inherit;
    font-size: 14px;
    text-align: left;
    text-decoration: none;
    white-space: nowrap;
    cursor: pointer;
  }

  .menu__list :global(.menu__item:hover) {
    background: var(--ui-row-hover, var(--ui-surface-muted));
  }

  .menu__list :global(.menu__item.is-danger) {
    color: var(--ui-danger);
  }

  .menu__list :global(.menu__item:disabled) {
    cursor: not-allowed;
    opacity: 0.5;
  }
</style>
