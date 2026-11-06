<script lang="ts">
  /** Кнопка або кнопка-посилання */
  import type { Snippet } from 'svelte';

  type Variant = 'primary' | 'ghost';

  let {
    variant = 'primary',
    type = 'button',
    href,
    disabled = false,
    onclick,
    children,
  }: {
    variant?: Variant;
    type?: 'button' | 'submit';
    href?: string;
    disabled?: boolean;
    onclick?: (event: MouseEvent) => void;
    children: Snippet;
  } = $props();
</script>

{#if href}
  <a class="ui-btn" class:is-ghost={variant === 'ghost'} {href}>{@render children()}</a>
{:else}
  <button class="ui-btn" class:is-ghost={variant === 'ghost'} {type} {disabled} {onclick}>{@render children()}</button>
{/if}

<style>
  .ui-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    padding: 0.6rem 1rem;
    border-radius: var(--ui-radius);
    border: 1px solid transparent;
    background: var(--ui-accent);
    color: #fff;
    font: inherit;
    cursor: pointer;
    text-decoration: none;
  }

  .ui-btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .ui-btn.is-ghost {
    background: transparent;
    color: var(--ui-text);
    border-color: var(--ui-border);
  }
</style>
