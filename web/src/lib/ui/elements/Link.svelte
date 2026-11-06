<script lang="ts">
  /** Текстове посилання */
  import type { Snippet } from 'svelte';

  let {
    href,
    active = false,
    children,
  }: {
    href: string;
    active?: boolean;
    children: Snippet;
  } = $props();
</script>

<a class="ui-link" class:is-active={active} {href}>{@render children()}</a>

<style>
  .ui-link {
    color: var(--ui-link);
    text-decoration: none;
    font-weight: 500;
  }

  .ui-link:hover,
  .ui-link.is-active {
    text-decoration: underline;
  }
</style>
