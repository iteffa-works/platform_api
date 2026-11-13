<script lang="ts">
  /** Картка-контейнер секції */
  import type { Snippet } from 'svelte';
  import { Stack } from '$lib/ui/patterns';

  let { children }: { children: Snippet } = $props();
</script>

<section class="ui-card">
  <Stack>{@render children()}</Stack>
</section>

<style>
  .ui-card {
    background: var(--ui-surface);
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius);
    box-shadow: var(--ui-shadow);
    padding: 1.25rem;
  }
</style>
