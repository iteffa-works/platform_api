<script lang="ts">
  import { Button, Text } from '$lib/ui/elements';
  import { useI18n } from '$lib/i18n';
  import { Card } from '$lib/ui/components';

  let { error }: { error: { status?: number; message?: string } } = $props();
  const { t } = useI18n();
</script>

<main class="error-page">
  <Card>
    <h1>{error?.status || 500}</h1>
    <Text tone="lead">{error?.status === 404 ? $t('error.notFound') : error?.message || $t('error.internal')}</Text>
    <Button href="/">{$t('error.home')}</Button>
  </Card>
</main>

<style>
  .error-page {
    width: var(--ui-shell);
    margin: 0 auto;
    padding: 64px 0;
  }
</style>
