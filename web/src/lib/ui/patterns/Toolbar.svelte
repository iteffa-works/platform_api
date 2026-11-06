<script lang="ts">
  /** Панель дій: заголовок зліва, дії справа */
  import type { Snippet } from 'svelte';

  let {
    start,
    end,
  }: {
    start: Snippet;
    end?: Snippet;
  } = $props();
</script>

<div class="ui-toolbar">
  <div class="ui-toolbar__start">{@render start()}</div>
  {#if end}
    <div class="ui-toolbar__end">{@render end()}</div>
  {/if}
</div>

<style>
  .ui-toolbar {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    justify-content: space-between;
    flex-wrap: wrap;
  }

  .ui-toolbar__start,
  .ui-toolbar__end {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
  }
</style>
