<script lang="ts">
  /** Випадне меню: кнопка-тригер + панель; закривається кліком поза ним, Esc і переходом */
  import type { Snippet } from 'svelte';
  import { afterNavigate } from '$app/navigation';

  let {
    label,
    trigger,
    children,
    width = 240,
  }: {
    /** Доступна назва кнопки */
    label: string;
    trigger: Snippet;
    children: Snippet;
    width?: number;
  } = $props();

  let open = $state(false);
  let root: HTMLDivElement;

  afterNavigate(() => {
    open = false;
  });

  function onWindowClick(event: MouseEvent) {
    if (open && !root.contains(event.target as Node)) open = false;
  }

  function onKey(event: KeyboardEvent) {
    if (event.key === 'Escape') open = false;
  }
</script>

<svelte:window onclick={onWindowClick} onkeydown={onKey} />

<div class="ui-dropdown" bind:this={root}>
  <button
    class="ui-dropdown__trigger"
    type="button"
    aria-label={label}
    title={label}
    aria-haspopup="menu"
    aria-expanded={open}
    onclick={() => (open = !open)}
  >
    {@render trigger()}
  </button>
  {#if open}
    <div class="ui-dropdown__panel" style:width="{width}px" role="menu">{@render children()}</div>
  {/if}
</div>

<style>
  .ui-dropdown {
    position: relative;
    display: flex;
  }

  .ui-dropdown__trigger {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 36px;
    padding: 0 8px;
    border: 0;
    border-radius: var(--ui-radius);
    background: transparent;
    color: inherit;
    font: inherit;
    cursor: pointer;
  }

  .ui-dropdown__trigger:hover,
  .ui-dropdown__trigger[aria-expanded='true'] {
    background: var(--ui-surface-muted);
  }

  .ui-dropdown__panel {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    z-index: 20;
    max-width: calc(100vw - 32px);
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius);
    background: var(--ui-surface);
    box-shadow: var(--ui-shadow-pop, 0 12px 32px -12px rgba(15, 23, 42, 0.35));
  }
</style>
