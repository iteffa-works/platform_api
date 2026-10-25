<script lang="ts">
  import Card from '$lib/shared/ui/Card.svelte';

  let { error }: { error: { status?: number; message?: string } } = $props();
</script>

<Card>
  <h1>{error?.status || 500}</h1>
  <p class="lead">{error?.message || 'Внутрішня помилка'}</p>
  <a class="btn" href="/">На головну</a>
</Card>
