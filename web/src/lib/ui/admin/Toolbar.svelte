<script lang="ts">
  /** Смуга фільтрів над таблицею: ліворуч сегменти / фільтри, праворуч — пошук і налаштування */
  import type { Snippet } from 'svelte';

  let { children, end }: { children?: Snippet; end?: Snippet } = $props();
</script>

<div class="toolbar">
  <div class="toolbar__start">{#if children}{@render children()}{/if}</div>
  {#if end}<div class="toolbar__end">{@render end()}</div>{/if}
</div>

<style lang="scss">
  .toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: space(2) space(4);
  }

  .toolbar__start,
  .toolbar__end {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: space(2);
    min-width: 0;
  }

  @include down(md) {
    .toolbar__end {
      width: 100%;

      > :global(*) {
        flex: 1;
      }
    }
  }
</style>
