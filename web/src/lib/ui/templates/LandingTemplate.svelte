<script lang="ts">
  /** Шаблон головної сторінки */
  import type { Snippet } from 'svelte';
  import { Card } from '$lib/ui/components';
  import { Text } from '$lib/ui/elements';

  let {
    title,
    lead,
    actions,
    meta,
  }: {
    title: string;
    lead: string;
    actions: Snippet;
    meta?: Snippet;
  } = $props();
</script>

<Card>
  <h1>{title}</h1>
  <Text tone="lead">{lead}</Text>
  {#if meta}{@render meta()}{/if}
  <div class="ui-landing-actions">{@render actions()}</div>
</Card>

<style>
  .ui-landing-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }
</style>
