<script lang="ts">
  /** Текстовий елемент з варіантами */
  import type { Snippet } from 'svelte';

  type Tone = 'body' | 'muted' | 'lead' | 'error';

  let {
    as = 'p',
    tone = 'body',
    children,
  }: {
    as?: 'p' | 'span' | 'div';
    tone?: Tone;
    children: Snippet;
  } = $props();
</script>

<svelte:element this={as} class="ui-text" class:is-muted={tone === 'muted'} class:is-lead={tone === 'lead'} class:is-error={tone === 'error'}>
  {@render children()}
</svelte:element>

<style>
  .ui-text { margin: 0; }
  .ui-text.is-muted { color: var(--ui-muted); }
  .ui-text.is-lead { color: var(--ui-muted); max-width: 42rem; }
  .ui-text.is-error { color: var(--ui-danger); }
</style>
