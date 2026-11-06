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
    padding: 0.55rem 0.4rem;
    border-bottom: 1px solid var(--ui-border);
    vertical-align: middle;
  }
</style>
