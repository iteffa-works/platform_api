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
    size = 'md',
    onclick,
    children,
  }: {
    variant?: Variant;
    type?: 'button' | 'submit';
    href?: string;
    disabled?: boolean;
    block?: boolean;
    size?: 'md' | 'lg';
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
    class:is-lg={size === 'lg'}
    {href}
  >{@render children()}</a>
{:else}
  <button
    class="ui-btn"
    class:is-ghost={variant === 'ghost'}
    class:is-cta={variant === 'cta'}
    class:is-block={block}
    class:is-lg={size === 'lg'}
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
    white-space: nowrap;
    box-shadow: none;
    transition: background 0.15s ease, border-color 0.15s ease;
  }

  .ui-btn:hover:not(:disabled) {
    background: var(--ui-accent-hover);
  }

  .ui-btn.is-lg {
    min-height: 48px;
    padding: 0 22px;
    font-size: 16px;
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
