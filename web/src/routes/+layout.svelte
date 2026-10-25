<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import 'fomantic-ui-css/semantic.min.css';
  import '../app.css';
  import { APP_NAME, APP_ORIGIN } from '$lib/config';
  import { initFomantic } from '$lib/core/ui';
  import AppShell from '$lib/shared/layout/AppShell.svelte';
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();

  onMount(() => {
    void initFomantic();
  });
</script>

<svelte:head>
  <title>{APP_NAME}</title>
  <link rel="canonical" href="{APP_ORIGIN}{$page.url.pathname}" />
</svelte:head>

<AppShell>
  {@render children()}
</AppShell>
