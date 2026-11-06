<script lang="ts">
  /** Шаблон головної сторінки */
  import type { Snippet } from 'svelte';
  import { Card } from '$lib/ui/components';
  import { Stack } from '$lib/ui/patterns';

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
  <Stack>
    <h1>{title}</h1>
    <p class="ui-lead">{lead}</p>
    {#if meta}{@render meta()}{/if}
    <div class="ui-landing-actions">{@render actions()}</div>
  </Stack>
</Card>

<style>
  .ui-landing-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }
</style>
