<script lang="ts">
  /** Текст помилки форми / панелі */
  import { Text } from '$lib/ui/elements';

  let { message = '' }: { message?: string } = $props();
</script>

{#if message}
  <Text tone="error">{message}</Text>
{/if}
