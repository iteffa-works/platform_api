<script lang="ts">
  /** Сегментований перемикач («Усі | Активні | Заблоковані»): посилання (href) або значення (onchange) */
  import type { Segment } from './types.js';

  let {
    items,
    value,
    onchange,
    label,
  }: {
    items: Segment[];
    /** Активний сегмент: value або href */
    value?: string;
    onchange?: (value: string) => void;
    label?: string;
  } = $props();

  const keyOf = (item: Segment) => item.value ?? item.href ?? item.label;
</script>

<div class="seg" role="tablist" aria-label={label}>
  {#each items as item (keyOf(item))}
    {@const active = keyOf(item) === value}
    {#if item.href}
      <a class="seg__item" class:is-active={active} href={item.href} role="tab" aria-selected={active}>
        {item.label}{#if item.count !== undefined}<span class="seg__count">{item.count}</span>{/if}
      </a>
    {:else}
      <button class="seg__item" class:is-active={active} type="button" role="tab" aria-selected={active} onclick={() => onchange?.(keyOf(item))}>
        {item.label}{#if item.count !== undefined}<span class="seg__count">{item.count}</span>{/if}
      </button>
    {/if}
  {/each}
</div>

<style lang="scss">
  .seg {
    display: inline-flex;
    max-width: 100%;
    overflow-x: auto;
    padding: 2px;
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius-md);
    background: var(--ui-surface);
    @include thin-scrollbar;
  }

  .seg__item {
    @include reset-button;
    @include focus-ring(-2px);
    display: inline-flex;
    flex: none;
    align-items: center;
    gap: space(1) + 2px;
    height: 28px;
    padding: 0 space(3);
    border-radius: var(--ui-radius-sm);
    color: var(--ui-muted);
    font-size: var(--ui-fs-sm);
    font-weight: 500;
    text-decoration: none;
    white-space: nowrap;

    &:hover {
      color: var(--ui-text);
    }

    &.is-active {
      background: var(--ui-accent);
      color: #fff;
    }
  }

  .seg__count {
    padding: 0 6px;
    border-radius: 999px;
    background: soft(currentColor, 15%);
    font-size: var(--ui-fs-xs);
  }
</style>
