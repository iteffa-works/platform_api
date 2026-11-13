<script lang="ts">
  /** Шаблон публічного лендингу: шапка, секції, футер */
  import type { Snippet } from 'svelte';
  import { APP_NAME } from '$lib/config';
  import { Brand } from '$lib/ui/elements';

  let { actions, children }: { actions?: Snippet; children: Snippet } = $props();

  const nav = [
    { href: '#features', label: 'Можливості' },
    { href: '#how', label: 'Як це працює' },
    { href: '#api', label: 'API' },
  ] as const;

  const year = new Date().getFullYear();
</script>

<div class="site">
  <header class="site__header">
    <div class="ui-container site__bar">
      <Brand image />
      <nav class="site__nav" aria-label="Розділи">
        {#each nav as item (item.href)}
          <a href={item.href}>{item.label}</a>
        {/each}
      </nav>
      {#if actions}<div class="site__actions">{@render actions()}</div>{/if}
    </div>
  </header>

  <main>{@render children()}</main>

  <footer class="site__footer">
    <div class="ui-container site__footer-row">
      <span>© {year} {APP_NAME}</span>
      <nav class="site__footer-nav" aria-label="Футер">
        {#each nav as item (item.href)}
          <a href={item.href}>{item.label}</a>
        {/each}
        <a href="/login">Вхід</a>
      </nav>
    </div>
  </footer>
</div>

<style>
  .site {
    min-height: 100vh;
    display: grid;
    grid-template-rows: auto 1fr auto;
    background: var(--ui-surface);
  }

  .site__header {
    position: sticky;
    top: 0;
    z-index: 10;
    background: color-mix(in srgb, var(--ui-surface) 85%, transparent);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--ui-border);
  }

  .site__bar {
    display: flex;
    align-items: center;
    gap: 32px;
    height: 64px;
  }

  .site__nav {
    display: flex;
    gap: 24px;
    flex: 1;
  }

  .site__nav a,
  .site__footer-nav a {
    color: var(--ui-muted);
    font-size: 14px;
    font-weight: 500;
    text-decoration: none;
  }

  .site__nav a:hover,
  .site__footer-nav a:hover {
    color: var(--ui-text);
  }

  .site__actions {
    display: flex;
    gap: 8px;
    margin-left: auto;
  }

  .site__footer {
    border-top: 1px solid var(--ui-border);
    background: var(--ui-surface-muted);
  }

  .site__footer-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 28px 0;
    color: var(--ui-muted);
    font-size: 14px;
  }

  .site__footer-nav {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
  }

  @media (max-width: 760px) {
    .site__nav {
      display: none;
    }
  }

  /* На вузьких екранах «Увійти» лишається в hero */
  @media (max-width: 480px) {
    .site__actions :global(.ui-btn.is-ghost) {
      display: none;
    }
  }
</style>
