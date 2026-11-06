<script lang="ts">
  /** Заголовок сторінки з підзаголовком і діями */
  import type { Snippet } from 'svelte';
  import { Text } from '$lib/ui/elements';
  import { Grow, Stack, Toolbar } from '$lib/ui/patterns';

  let {
    title,
    subtitle = '',
    actions,
  }: {
    title: string;
    subtitle?: string;
    actions?: Snippet;
  } = $props();
</script>

<Toolbar>
  {#snippet start()}
    <Grow>
      <Stack gap="sm">
        <h1>{title}</h1>
        {#if subtitle}
          <Text tone="muted">{subtitle}</Text>
        {/if}
      </Stack>
    </Grow>
  {/snippet}
  {#snippet end()}
    {#if actions}{@render actions()}{/if}
  {/snippet}
</Toolbar>
