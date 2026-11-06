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
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
    color: var(--ui-text);
  }

  .ui-label.is-grow {
    flex: 1;
    min-width: 12rem;
  }
</style>
