<script lang="ts">
  /** Індикатор завантаження */
  import { Text } from '$lib/ui/elements';

  let { text = 'Завантаження…' }: { text?: string } = $props();
</script>

<Text tone="muted">{text}</Text>
