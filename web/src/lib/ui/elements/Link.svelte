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
    color: var(--ui-text);
    text-decoration: none;
  }

  .ui-link.is-active,
  .ui-link:hover {
    color: var(--ui-accent);
  }
</style>
