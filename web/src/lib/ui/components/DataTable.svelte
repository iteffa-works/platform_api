<script lang="ts">
  /** Проста таблиця даних */
  import type { Snippet } from 'svelte';

  let {
    head,
    body,
  }: {
    head: Snippet;
    body: Snippet;
  } = $props();
</script>

<div class="ui-table-wrap">
  <table class="ui-table">
    <thead>{@render head()}</thead>
    <tbody>{@render body()}</tbody>
  </table>
</div>

<style>
  .ui-table-wrap { overflow-x: auto; }

  .ui-table {
    width: 100%;
    border-collapse: collapse;
  }

  .ui-table {
    font-size: var(--ui-fs-sm, 14px);
  }

  .ui-table :global(th),
  .ui-table :global(td) {
    text-align: left;
    padding: var(--ui-cell-y, 12px) 16px;
    border-bottom: 1px solid var(--ui-border-soft, var(--ui-border));
    vertical-align: middle;
  }

  .ui-table :global(tbody tr:hover) {
    background: var(--ui-row-hover, transparent);
  }

  /* Заголовки колонок — дрібний капс */
  /* Шапка — смуга з токенів теми (як таблиці адмінки) */
  .ui-table :global(th) {
    padding-block: var(--ui-grid-head-y, 10px);
    border-bottom-color: var(--ui-grid-head-border, var(--ui-border));
    background: var(--ui-grid-head-bg, transparent);
    color: var(--ui-muted);
    font-size: var(--ui-grid-head-fs, 11px);
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .ui-table :global(tbody tr:last-child td) {
    border-bottom: 0;
  }
</style>
