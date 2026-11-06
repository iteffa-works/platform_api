<script lang="ts">
  import { Button, Text } from '$lib/ui/elements';
  import { Card } from '$lib/ui/components';
  import { Stack } from '$lib/ui/patterns';

  let { error }: { error: { status?: number; message?: string } } = $props();
</script>

<Card>
  <Stack>
    <h1>{error?.status || 500}</h1>
    <Text tone="lead">{error?.message || 'Внутрішня помилка'}</Text>
    <Button href="/">На головну</Button>
  </Stack>
</Card>
