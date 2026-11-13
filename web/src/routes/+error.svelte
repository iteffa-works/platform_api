<script lang="ts">
  import { Button, Text } from '$lib/ui/elements';
  import { Card } from '$lib/ui/components';

  let { error }: { error: { status?: number; message?: string } } = $props();
</script>

<main class="error-page">
  <Card>
    <h1>{error?.status || 500}</h1>
    <Text tone="lead">{error?.message || 'Внутрішня помилка'}</Text>
    <Button href="/">На головну</Button>
  </Card>
</main>

<style>
  .error-page {
    width: var(--ui-shell);
    margin: 0 auto;
    padding: 64px 0;
  }
</style>
