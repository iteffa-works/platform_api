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

  .ui-table :global(th),
  .ui-table :global(td) {
    text-align: left;
    padding: 12px 16px;
    border-bottom: 1px solid var(--ui-border);
    vertical-align: middle;
  }

  /* Заголовки колонок — дрібний капс */
  .ui-table :global(th) {
    padding-block: 10px;
    color: var(--ui-muted);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .ui-table :global(tbody tr:last-child td) {
    border-bottom: 0;
  }
</style>
