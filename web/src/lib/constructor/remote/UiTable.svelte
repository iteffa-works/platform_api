<script lang="ts">
  /** Таблиця схеми: компактні рядки, наведення, приглушені рядки; `search` — фільтр рядків на клієнті */
  import { EmptyState } from '$lib/ui/components';
  import type { Inline, UiNode as Node } from './schema.js';
  import UiNode from './UiNode.svelte';

  type Table = Extract<Node, { type: 'table' }>;
  let { node }: { node: Table } = $props();

  let query = $state('');

  /** Текст вузлів для пошуку (рядки, посилання, бейджі, код) */
  function textOf(value: unknown): string {
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) return value.map(textOf).join(' ');
    if (value && typeof value === 'object') {
      const item = value as Record<string, unknown>;
      return ['text', 'label', 'b', 'children', 'value'].map((key) => textOf(item[key] as Inline)).join(' ');
    }
    return '';
  }

  const index = $derived(node.rows.map((row) => textOf(Object.values(row.cells)).toLowerCase()));
  const rows = $derived.by(() => {
    const needle = query.trim().toLowerCase();
    return needle ? node.rows.filter((_row, position) => index[position]!.includes(needle)) : node.rows;
  });
</script>

{#if node.search && node.rows.length > 5}
  <div class="search">
    <input type="search" placeholder={node.search} aria-label={node.search} bind:value={query} />
    {#if query}<span class="count">{rows.length} / {node.rows.length}</span>{/if}
  </div>
{/if}

{#if rows.length === 0}
  <div class="empty"><EmptyState text={query ? '—' : node.empty ?? '—'} /></div>
{:else}
  <div class="wrap">
    <table class="table">
      <thead>
        <tr>
          {#each node.columns as column (column.key)}
            <th class:is-right={column.align === 'right'} style:width={column.width}>{column.label}</th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each rows as row (row.key)}
          <tr class:is-muted={row.muted}>
            {#each node.columns as column (column.key)}
              <td class:is-right={column.align === 'right'}>
                <div class="cell" class:is-right={column.align === 'right'}>
                  {#each row.cells[column.key] ?? [] as child, position (position)}<UiNode node={child} />{/each}
                </div>
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}

<style>
  .search {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 16px;
    border-bottom: 1px solid var(--ui-border-soft, var(--ui-border));
  }

  .search input {
    flex: 1;
    max-width: 360px;
    height: 34px;
    padding: 0 12px;
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius-md);
    background: var(--ui-surface);
    color: inherit;
    font: inherit;
    font-size: 14px;
  }

  .search input:focus {
    border-color: var(--ui-accent);
    outline: 2px solid var(--ui-accent-soft);
  }

  .count {
    color: var(--ui-muted);
    font-size: 13px;
  }

  .wrap {
    overflow-x: auto;
  }

  .table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
  }

  th {
    padding: 10px 16px;
    border-bottom: 1px solid var(--ui-border);
    background: var(--ui-surface-muted);
    color: var(--ui-muted);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-align: left;
    text-transform: uppercase;
    white-space: nowrap;
  }

  td {
    padding: 10px 16px;
    border-bottom: 1px solid var(--ui-border-soft, var(--ui-border));
    vertical-align: middle;
  }

  tbody tr:last-child td {
    border-bottom: 0;
  }

  tbody tr:hover td {
    background: var(--ui-row-hover, var(--ui-surface-muted));
  }

  tr.is-muted td {
    opacity: 0.6;
  }

  .cell {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 3px;
    min-width: 0;
  }

  .is-right {
    text-align: right;
  }

  .cell.is-right {
    align-items: flex-end;
  }

  .empty {
    padding: 20px 16px;
  }
</style>
