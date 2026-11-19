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
    overflow: hidden;
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius-lg, var(--ui-radius));
    background: var(--ui-surface);
  }

  .ui-panel__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-height: 56px;
    padding: 10px 16px;
    border-bottom: 1px solid var(--ui-border-soft, var(--ui-border));
  }

  /* Заголовок і дія — як у панелях адмінки (жирний заголовок, дія — пласка кнопка) */
  .ui-panel__title {
    font-size: 15px;
    font-weight: 700;
  }

  .ui-panel__action {
    display: inline-flex;
    align-items: center;
    height: 30px;
    padding: 0 12px;
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius-md, var(--ui-radius));
    color: var(--ui-text);
    font-size: var(--ui-fs-sm, 13px);
    font-weight: 600;
    text-decoration: none;
  }

  .ui-panel__action:hover {
    border-color: var(--ui-border-strong, var(--ui-border));
    background: var(--ui-surface-muted);
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
