<script lang="ts">
  import { page } from '$app/stores';
  import '$lib/ui/styles/index.css';
  import { APP_NAME, APP_ORIGIN } from '$lib/config';
  import { registerAllAuthExtensions } from '$lib/domain/auth';
  import type { Snippet } from 'svelte';

  registerAllAuthExtensions();

  let { children }: { children: Snippet } = $props();
</script>

<svelte:head>
  <title>{APP_NAME}</title>
  <link rel="canonical" href="{APP_ORIGIN}{$page.url.pathname}" />
</svelte:head>

{@render children()}
