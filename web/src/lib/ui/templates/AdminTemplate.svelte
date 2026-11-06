<script lang="ts">
  /** Шаблон адмінки */
  import type { Snippet } from 'svelte';
  import { Card, ErrorText, PageHeader } from '$lib/ui/components';
  import { PageLayout } from '$lib/ui/layouts';

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

<PageLayout>
  <Card>
    <PageHeader {title} {subtitle}>
      {#snippet actions()}
        {#if actions}{@render actions()}{/if}
      {/snippet}
    </PageHeader>
    <ErrorText message={error} />
  </Card>
  {@render children()}
</PageLayout>
