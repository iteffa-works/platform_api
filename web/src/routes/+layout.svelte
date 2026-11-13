<script lang="ts">
  import { page } from '$app/stores';
  import '$lib/ui/styles/index.css';
  import { registerAllBlocks } from '$lib/blocks/register';
  import { APP_NAME, APP_ORIGIN } from '$lib/config';
  import { registerAllAuthExtensions } from '$lib/domain/auth';
  import { AppShell } from '$lib/ui/layouts';
  import type { Snippet } from 'svelte';

  registerAllBlocks();
  registerAllAuthExtensions();

  let { children }: { children: Snippet } = $props();
</script>

<svelte:head>
  <title>{APP_NAME}</title>
  <link rel="canonical" href="{APP_ORIGIN}{$page.url.pathname}" />
</svelte:head>

<AppShell>
  {@render children()}
</AppShell>
