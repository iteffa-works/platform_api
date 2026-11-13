<script lang="ts">
  /** Шаблон адмінки */
  import type { Snippet } from 'svelte';
  import { Card, ErrorText, PageHeader } from '$lib/ui/components';
  import { Stack } from '$lib/ui/patterns';

  let {
    title,
    subtitle = '',
    error = '',
    actions,
    children,
  }: {
    title: string;
    subtitle?: string;
    error?: string;
    actions?: Snippet;
    children: Snippet;
  } = $props();
</script>

<Stack gap="lg">
  <Card>
    <PageHeader {title} {subtitle}>
      {#snippet actions()}
        {#if actions}{@render actions()}{/if}
      {/snippet}
    </PageHeader>
    <ErrorText message={error} />
  </Card>
  {@render children()}
</Stack>
