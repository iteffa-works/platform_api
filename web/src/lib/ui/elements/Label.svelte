<script lang="ts">
  /** Підпис поля */
  import type { Snippet } from 'svelte';

  let {
    grow = false,
    children,
  }: {
    grow?: boolean;
    children: Snippet;
  } = $props();
</script>

<label class="ui-label" class:is-grow={grow}>{@render children()}</label>

<style>
  .ui-label {
    display: grid;
    gap: 0.35rem;
    font-size: 0.92rem;
  }

  .ui-label.is-grow {
    flex: 1;
    min-width: 12rem;
  }
</style>
