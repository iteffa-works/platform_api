<script lang="ts">
  /** Адмінка: верхня панель, вкладки розділів плагіна, заголовок */
  import type { Snippet } from 'svelte';
  import { Card, ErrorText, PageHeader } from '$lib/ui/components';
  import { Topbar } from '$lib/ui/layouts';
  import { NavTabs, Stack } from '$lib/ui/patterns';

  type Item = { href: string; label: string };

  let {
    title,
    subtitle = '',
    error = '',
    nav = [],
    current,
    children,
  }: {
    title: string;
    subtitle?: string;
    error?: string;
    nav?: Item[];
    current: string;
    children: Snippet;
  } = $props();
</script>

<div class="ui-page">
  <Stack gap="lg">
    <Topbar />
    <NavTabs items={nav} {current} />
    <Card>
      <PageHeader {title} {subtitle} />
      <ErrorText message={error} />
    </Card>
    {@render children()}
  </Stack>
</div>

<style>
  .ui-page {
    width: min(1120px, calc(100% - 32px));
    margin: 0 auto;
    padding: 24px 0 64px;
  }
</style>
