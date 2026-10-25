<script lang="ts">
  import AppHeader from '$lib/shared/layout/AppHeader.svelte';
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();
</script>

<div class="shell">
  <AppHeader />
  <main class="page">{@render children()}</main>
</div>
