<script lang="ts">
  /** Заголовок сторінки з підзаголовком */
  import { Text } from '$lib/ui/elements';
  import { Stack } from '$lib/ui/patterns';

  let { title, subtitle = '' }: { title: string; subtitle?: string } = $props();
</script>

<Stack gap="sm">
  <h1>{title}</h1>
  {#if subtitle}
    <Text tone="muted">{subtitle}</Text>
  {/if}
</Stack>
