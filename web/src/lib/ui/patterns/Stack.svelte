<script lang="ts">
  /** Вертикальний стек */
  import type { Snippet } from 'svelte';

  let {
    gap = 'md',
    children,
  }: {
    gap?: 'sm' | 'md' | 'lg';
    children: Snippet;
  } = $props();
</script>

<div class="ui-stack" class:is-sm={gap === 'sm'} class:is-lg={gap === 'lg'}>
  {@render children()}
</div>

<style>
  .ui-stack {
    display: grid;
    gap: var(--ui-gap);
  }

  .ui-stack.is-sm { gap: 8px; }
  .ui-stack.is-lg { gap: var(--ui-gap-lg); }
</style>
