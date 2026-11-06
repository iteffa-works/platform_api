<script lang="ts">
  /** Шаблон кабінету: шапка + контент */
  import type { Snippet } from 'svelte';
  import { Banner, Card, ErrorText, PageHeader } from '$lib/ui/components';
  import { PageLayout } from '$lib/ui/layouts';

  let {
    title,
    subtitle = '',
    banner = '',
    error = '',
    actions,
    children,
  }: {
    title: string;
    subtitle?: string;
    banner?: string;
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
    {#if banner}<Banner text={banner} />{/if}
    <ErrorText message={error} />
  </Card>
  {@render children()}
</PageLayout>
