<script lang="ts">
  /** Пагінація: «Результати: 1–50 з 168» ліворуч, сторінки й розмір сторінки праворуч */
  import { Icon } from '$lib/ui/elements';

  let {
    page,
    total,
    perPage,
    perPageOptions = [20, 50, 100],
    summary,
    onpage,
    onperpage,
    labels = { prev: 'Previous', next: 'Next', perPage: 'Per page' },
  }: {
    /** Поточна сторінка з 1 */
    page: number;
    total: number;
    perPage: number;
    perPageOptions?: number[];
    /** Готовий текст ліворуч; за замовчуванням «from–to / total» */
    summary?: string;
    onpage: (page: number) => void;
    onperpage?: (perPage: number) => void;
    labels?: { prev: string; next: string; perPage: string };
  } = $props();

  const pages = $derived(Math.max(1, Math.ceil(total / perPage)));
  const from = $derived(total === 0 ? 0 : (page - 1) * perPage + 1);
  const to = $derived(Math.min(total, page * perPage));

  /** 1 … 4 5 [6] 7 8 … 20 */
  const items = $derived.by(() => {
    const set = new Set([1, pages, page - 1, page, page + 1]);
    const list = [...set].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
    const result: Array<number | 'gap'> = [];
    for (const [index, n] of list.entries()) {
      if (index && n - list[index - 1]! > 1) result.push('gap');
      result.push(n);
    }
    return result;
  });
</script>

<div class="pager">
  <span class="pager__summary">{summary ?? `${from}–${to} / ${total}`}</span>
  <div class="pager__nav">
    <button type="button" class="pager__btn" disabled={page <= 1} onclick={() => onpage(page - 1)} aria-label={labels.prev}>
      <Icon name="chevron-left" size={14} />
    </button>
    {#each items as item, index (index)}
      {#if item === 'gap'}
        <span class="pager__gap">…</span>
      {:else}
        <button type="button" class="pager__btn" class:is-active={item === page} aria-current={item === page ? 'page' : undefined} onclick={() => onpage(item)}>{item}</button>
      {/if}
    {/each}
    <button type="button" class="pager__btn" disabled={page >= pages} onclick={() => onpage(page + 1)} aria-label={labels.next}>
      <Icon name="chevron-right" size={14} />
    </button>
    {#if onperpage}
      <select class="pager__size" value={perPage} aria-label={labels.perPage} onchange={(event) => onperpage(Number(event.currentTarget.value))}>
        {#each perPageOptions as option (option)}<option value={option}>{option}</option>{/each}
      </select>
    {/if}
  </div>
</div>

<style lang="scss">
  .pager {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: space(2) space(4);
    font-size: var(--ui-fs-sm);
  }

  .pager__summary {
    color: var(--ui-muted);
  }

  .pager__nav {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .pager__btn {
    @include icon-button(30px);
    min-width: 30px;
    width: auto;
    padding: 0 space(2);
    color: var(--ui-text-2);
    font-size: var(--ui-fs-sm);
    font-variant-numeric: tabular-nums;

    &.is-active {
      background: var(--ui-accent);
      color: #fff;
    }

    &:disabled {
      opacity: 0.35;
      cursor: default;
      background: none;
    }
  }

  .pager__gap {
    padding: 0 space(1);
    color: var(--ui-muted);
  }

  .pager__size {
    @include control(30px);
    margin-left: space(2);
    padding: 0 space(2);
    cursor: pointer;
  }
</style>
