<script lang="ts">
  /** Порожній стан списку */
  import { Text } from '$lib/ui/elements';

  let { text }: { text: string } = $props();
</script>

<Text tone="muted">{text}</Text>
