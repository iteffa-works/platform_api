<script lang="ts">
  /** Єдина точка рендеру: сторінка з каталогу конструктора */
  import { invalidateAll } from '$app/navigation';
  import { onMount } from 'svelte';
  import { PageHost, type RegisteredPage } from '$lib/constructor';

  let { data }: { data: { page: RegisteredPage; ready: boolean } } = $props();

  // Захищена сторінка після SSR: повторити load у браузері (див. +page.ts)
  onMount(() => {
    if (!data.ready) void invalidateAll();
  });
</script>

{#if data.ready}
  <PageHost page={data.page} />
{/if}
