<script lang="ts">
  /** Хлібні крихти: «Головна / Розділ / Сторінка»; останній пункт — поточний */
  import type { Crumb } from './types.js';

  let { items }: { items: Crumb[] } = $props();
</script>

{#if items.length}
  <nav class="crumbs" aria-label="Breadcrumbs">
    <ol>
      {#each items as item, index (index)}
        <li>
          {#if item.href && index < items.length - 1}
            <a href={item.href}>{item.label}</a>
          {:else}
            <span aria-current={index === items.length - 1 ? 'page' : undefined}>{item.label}</span>
          {/if}
        </li>
      {/each}
    </ol>
  </nav>
{/if}

<style lang="scss">
  .crumbs ol {
    display: flex;
    flex-wrap: wrap;
    gap: space(1);
    margin: 0;
    padding: 0;
    list-style: none;
    color: var(--ui-muted);
    font-size: var(--ui-fs-xs);
  }

  li:not(:last-child)::after {
    content: '/';
    margin-left: space(1);
    opacity: 0.6;
  }

  a {
    color: inherit;
    text-decoration: none;

    &:hover {
      color: var(--ui-accent);
    }
  }

  [aria-current] {
    color: var(--ui-text-2);
  }
</style>
