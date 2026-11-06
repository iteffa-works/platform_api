<script lang="ts">
  /** Кнопка або кнопка-посилання */
  import type { Snippet } from 'svelte';

  type Variant = 'primary' | 'ghost' | 'cta';

  let {
    variant = 'primary',
    type = 'button',
    href,
    disabled = false,
    block = false,
    onclick,
    children,
  }: {
    variant?: Variant;
    type?: 'button' | 'submit';
    href?: string;
    disabled?: boolean;
    block?: boolean;
    onclick?: (event: MouseEvent) => void;
    children: Snippet;
  } = $props();
</script>

{#if href}
  <a
    class="ui-btn"
    class:is-ghost={variant === 'ghost'}
    class:is-cta={variant === 'cta'}
    class:is-block={block}
    {href}
  >{@render children()}</a>
{:else}
  <button
    class="ui-btn"
    class:is-ghost={variant === 'ghost'}
    class:is-cta={variant === 'cta'}
    class:is-block={block}
    {type}
    {disabled}
    {onclick}
  >{@render children()}</button>
{/if}

<style>
  .ui-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    min-height: var(--ui-control-h);
    padding: 0 16px;
    border-radius: var(--ui-radius);
    border: 1px solid transparent;
    background: var(--ui-accent);
    color: #fff;
    font: inherit;
    font-weight: 600;
    cursor: pointer;
    text-decoration: none;
    box-shadow: none;
  }

  .ui-btn.is-block {
    width: 100%;
  }

  .ui-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .ui-btn.is-ghost {
    background: var(--ui-surface);
    color: var(--ui-text);
    border-color: var(--ui-border);
    font-weight: 500;
  }

  .ui-btn.is-ghost:hover:not(:disabled) {
    background: var(--ui-surface-muted);
    border-color: var(--ui-border-strong);
  }

  .ui-btn.is-cta {
    background: var(--ui-cta);
    color: #fff;
    border-color: var(--ui-cta);
  }

  .ui-btn.is-cta:hover:not(:disabled) {
    background: var(--ui-cta-hover);
    border-color: var(--ui-cta-hover);
  }
</style>
