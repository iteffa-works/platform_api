<script lang="ts">
  /** Картка-секція: заголовок, опис і дії в шапці; `flush` — вміст без відступів (таблиця, список) */
  import type { Snippet } from 'svelte';

  let {
    title,
    description,
    actions,
    flush = false,
    children,
  }: {
    title?: string;
    description?: string;
    actions?: Snippet;
    flush?: boolean;
    children: Snippet;
  } = $props();
</script>

<section class="section" class:is-flush={flush}>
  {#if title || actions}
    <header class="section__head">
      <div>
        {#if title}<h2>{title}</h2>{/if}
        {#if description}<p>{description}</p>{/if}
      </div>
      {#if actions}<div class="section__actions">{@render actions()}</div>{/if}
    </header>
  {/if}
  <div class="section__body">{@render children()}</div>
</section>

<style lang="scss">
  .section {
    @include surface;
    min-width: 0;
  }

  .section__head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: space(2) space(4);
    padding: space(4) space(5);
    border-bottom: 1px solid var(--ui-border-soft);
  }

  h2 {
    font-size: 15px;
    font-weight: 600;
  }

  p {
    margin: 2px 0 0;
    color: var(--ui-muted);
    font-size: var(--ui-fs-sm);
  }

  .section__actions {
    display: flex;
    gap: space(2);
  }

  .section__body {
    padding: space(5);

    .is-flush & {
      padding: 0;
    }
  }
</style>
