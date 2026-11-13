<script lang="ts">
  /** Шаблон адмінки */
  import type { Snippet } from 'svelte';
  import { Card, ErrorText, PageHeader } from '$lib/ui/components';
  import { Topbar } from '$lib/ui/layouts';
  import { Stack } from '$lib/ui/patterns';

  let {
    title,
    subtitle = '',
    error = '',
    children,
  }: {
    title: string;
    subtitle?: string;
    error?: string;
    children: Snippet;
  } = $props();
</script>

<div class="ui-page">
  <Stack gap="lg">
    <Topbar />
    <Card>
      <PageHeader {title} {subtitle} />
      <ErrorText message={error} />
    </Card>
    {@render children()}
  </Stack>
</div>

<style>
  .ui-page {
    width: var(--ui-shell);
    margin: 0 auto;
    padding: 24px 0 64px;
  }
</style>
