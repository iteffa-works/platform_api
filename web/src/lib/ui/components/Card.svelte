<script lang="ts">
  /** Картка-контейнер секції */
  import type { Snippet } from 'svelte';
  import { Stack } from '$lib/ui/patterns';

  let {
    narrow = false,
    children,
  }: {
    narrow?: boolean;
    children: Snippet;
  } = $props();
</script>

<section class="ui-card" class:is-narrow={narrow}>
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

  .ui-card.is-narrow {
    width: min(420px, 100%);
    margin: 40px auto 0;
  }
</style>
