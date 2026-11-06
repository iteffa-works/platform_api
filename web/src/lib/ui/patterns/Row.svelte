<script lang="ts">
  /** Горизонтальний ряд */
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();
</script>

<div class="ui-row">{@render children()}</div>

<style>
  .ui-row {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
  }
</style>
