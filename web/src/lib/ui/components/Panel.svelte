<script lang="ts">
  /** Панель секції: заголовок капсом + дія праворуч; `flush` — тіло без відступів (таблиці) */
  import type { Snippet } from 'svelte';

  let {
    title,
    action,
    flush = false,
    children,
  }: {
    title: string;
    action?: { href: string; label: string };
    flush?: boolean;
    children: Snippet;
  } = $props();
</script>

<section class="ui-panel">
  <header class="ui-panel__head">
    <h2 class="ui-panel__title">{title}</h2>
    {#if action}<a class="ui-panel__action" href={action.href}>{action.label}</a>{/if}
  </header>
  <div class="ui-panel__body" class:is-flush={flush}>{@render children()}</div>
</section>

<style>
  .ui-panel {
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius);
    background: var(--ui-surface);
  }

  .ui-panel__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 16px;
    border-bottom: 1px solid var(--ui-border);
  }

  .ui-panel__title {
    font-size: 15px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .ui-panel__action {
    color: var(--ui-link);
    font-size: 13px;
    text-decoration: none;
  }

  .ui-panel__action:hover {
    text-decoration: underline;
  }

  .ui-panel__body {
    display: grid;
    gap: 12px;
    padding: 16px;
  }

  .ui-panel__body.is-flush {
    padding: 0;
  }
</style>
