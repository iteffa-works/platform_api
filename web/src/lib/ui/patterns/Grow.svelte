<script lang="ts">
  /** Розтягує дочірній блок у Row */
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();
</script>

<div class="ui-grow">{@render children()}</div>

<style>
  .ui-grow { flex: 1; min-width: 0; }
</style>
