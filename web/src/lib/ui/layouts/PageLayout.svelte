<script lang="ts">
  /** Макет звичайної сторінки зі стеком секцій */
  import type { Snippet } from 'svelte';
  import { Stack } from '$lib/ui/patterns';

  let { children }: { children: Snippet } = $props();
</script>

<Stack gap="lg">{@render children()}</Stack>
