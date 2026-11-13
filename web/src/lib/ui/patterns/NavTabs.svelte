<script lang="ts">
  /** Вкладки розділу: активна — за поточним шляхом */
  type Item = { href: string; label: string };

  let { items, current }: { items: Item[]; current: string } = $props();
</script>

{#if items.length}
  <nav class="ui-tabs" aria-label="Розділи">
    {#each items as item (item.href)}
      <a class="ui-tabs__link" class:is-active={item.href === current} href={item.href}>{item.label}</a>
    {/each}
  </nav>
{/if}

<style>
  .ui-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
  }

  .ui-tabs__link {
    padding: 6px 0;
    border-bottom: 2px solid transparent;
    color: var(--ui-muted);
    font-size: 14px;
    font-weight: 600;
    text-decoration: none;
  }

  .ui-tabs__link:hover {
    color: var(--ui-text);
  }

  .ui-tabs__link.is-active {
    color: var(--ui-text);
    border-bottom-color: var(--ui-accent);
  }
</style>
