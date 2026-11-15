<script lang="ts" generics="Row">
  /**
   * Таблиця робочого простору: липка шапка, сортування, тон рядка (попередження / помилка),
   * порожній стан і скелетон завантаження. Вміст клітинок — сніпет `cell(row, column)`.
   */
  import { Icon } from '$lib/ui/elements';
  import type { Snippet } from 'svelte';

  import type { GridColumn, GridSort, GridTone } from './types.js';

  let {
    columns,
    rows,
    rowKey,
    rowTone,
    cell,
    sort,
    onsort,
    loading = false,
    empty = '—',
    footer,
    dense = false,
  }: {
    columns: GridColumn[];
    rows: Row[];
    rowKey: (row: Row) => string | number;
    rowTone?: (row: Row) => GridTone | undefined;
    cell: Snippet<[Row, GridColumn]>;
    sort?: GridSort;
    onsort?: (sort: GridSort) => void;
    loading?: boolean;
    empty?: string;
    /** Нижня смуга картки (пагінація) */
    footer?: Snippet;
    dense?: boolean;
  } = $props();

  function toggle(column: GridColumn) {
    if (!column.sortable || !onsort) return;
    const dir = sort?.key === column.key && sort.dir === 'asc' ? 'desc' : 'asc';
    onsort({ key: column.key, dir });
  }

  const ariaSort = (column: GridColumn) =>
    sort?.key === column.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : column.sortable ? 'none' : undefined;
</script>

<div class="grid" class:is-dense={dense}>
  <div class="grid__scroll">
    <table>
      <thead>
        <tr>
          {#each columns as column (column.key)}
            <th data-align={column.align ?? 'left'} style:width={column.width} aria-sort={ariaSort(column)}>
              {#if column.sortable && onsort}
                <button type="button" class="grid__sort" class:is-active={sort?.key === column.key} onclick={() => toggle(column)}>
                  {column.label}
                  <span class="grid__arrow" class:is-desc={sort?.key === column.key && sort.dir === 'desc'}><Icon name="chevron-down" size={12} /></span>
                </button>
              {:else}
                {column.label}
              {/if}
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#if loading && rows.length === 0}
          {#each { length: 6 } as _, index (index)}
            <tr class="grid__skeleton">
              {#each columns as column (column.key)}<td><span></span></td>{/each}
            </tr>
          {/each}
        {:else}
          {#each rows as row (rowKey(row))}
            <tr data-tone={rowTone?.(row)}>
              {#each columns as column (column.key)}
                <td data-align={column.align ?? 'left'}>{@render cell(row, column)}</td>
              {/each}
            </tr>
          {:else}
            <tr><td class="grid__empty" colspan={columns.length}>{empty}</td></tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </div>
  {#if footer}<div class="grid__foot">{@render footer()}</div>{/if}
</div>

<style lang="scss">
  .grid {
    @include surface;
    overflow: hidden;
    --cell-y: 12px;

    &.is-dense {
      --cell-y: 8px;
    }
  }

  .grid__scroll {
    overflow-x: auto;
    @include thin-scrollbar;
  }

  table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    font-size: var(--ui-fs-sm);
  }

  th,
  td {
    padding: var(--cell-y) space(4);
    border-bottom: 1px solid var(--ui-border-soft);
    text-align: left;
    vertical-align: middle;

    &[data-align='right'] { text-align: right; }
    &[data-align='center'] { text-align: center; }
  }

  th {
    position: sticky;
    top: 0;
    z-index: 1;
    padding-block: space(3);
    background: var(--ui-surface);
    color: var(--ui-muted);
    font-size: var(--ui-fs-xs);
    font-weight: 600;
    white-space: nowrap;
  }

  td {
    color: var(--ui-text);

    :global(a) {
      color: var(--ui-link);
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }
  }

  tbody tr {
    transition: background 0.12s;

    &:hover {
      background: var(--ui-row-hover);
    }

    &:last-child td {
      border-bottom: 0;
    }

    // Тон рядка: м'яка заливка + смуга ліворуч
    &[data-tone] td {
      background: var(--row-bg);
    }

    &[data-tone] td:first-child {
      box-shadow: inset 3px 0 0 var(--row-edge);
    }

    &[data-tone='warn'] { --row-bg: var(--ui-warn-soft); --row-edge: var(--ui-warn); }
    &[data-tone='danger'] { --row-bg: var(--ui-danger-soft); --row-edge: var(--ui-danger); }
    &[data-tone='success'] { --row-bg: #{soft(var(--ui-success), 8%)}; --row-edge: var(--ui-success); }
    &[data-tone='muted'] { --row-bg: transparent; --row-edge: transparent; }
    &[data-tone='muted'] td { color: var(--ui-muted); }
  }

  .grid__sort {
    @include reset-button;
    @include focus-ring;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: inherit;
    font-size: inherit;
    font-weight: inherit;

    &:hover,
    &.is-active {
      color: var(--ui-text);
    }
  }

  .grid__arrow {
    display: inline-flex;
    opacity: 0.35;
    transition: transform 0.15s;

    .is-active & {
      opacity: 1;
    }

    &:not(.is-desc) {
      transform: rotate(180deg);
    }
  }

  .grid__empty {
    padding: space(10) space(4);
    color: var(--ui-muted);
    text-align: center;
  }

  .grid__skeleton span {
    display: block;
    height: 10px;
    border-radius: 4px;
    background: linear-gradient(90deg, var(--ui-surface-muted), var(--ui-border-soft), var(--ui-surface-muted));
    background-size: 200% 100%;
    animation: shimmer 1.2s infinite linear;
  }

  @keyframes shimmer {
    to {
      background-position: -200% 0;
    }
  }

  .grid__foot {
    padding: space(3) space(4);
    border-top: 1px solid var(--ui-border-soft);
  }
</style>
