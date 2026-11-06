<script lang="ts">
  /** Кабінет FlowAxy: shell + контент */
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import type { Snippet } from 'svelte';
  import { logout, user } from '$lib/domain/auth';

  let {
    title = 'Dashboard',
    subtitle = '',
    banner = '',
    error = '',
    actions,
    children,
  }: {
    title?: string;
    subtitle?: string;
    banner?: string;
    error?: string;
    actions?: Snippet;
    children: Snippet;
  } = $props();

  const nav = [
    { href: '/app', label: 'Dashboard' },
    { href: '/app#websites', label: 'Websites' },
    { href: '/app#domains', label: 'Custom domains' },
    { href: '/app#handlers', label: 'Notification handlers' },
  ] as const;

  function onLogout() {
    logout();
    goto('/login');
  }
</script>

<div class="cab">
  <header class="cab__top">
    <div class="cab__brand">
      <img class="cab__logo" src="/brand/logo_light.png" alt="FlowAxy" />
    </div>

    <nav class="cab__nav" aria-label="Cabinet">
      {#each nav as item (item.label)}
        <a
          class="cab__nav-link"
          class:is-active={item.href === '/app' && $page.url.pathname === '/app' && !item.href.includes('#')}
          href={item.href}
        >
          {item.label}
        </a>
      {/each}
    </nav>

    <div class="cab__tools">
      <button class="cab__tool" type="button" title="Theme">💡</button>
      <button class="cab__tool" type="button" title="Language">EN</button>
      <span class="cab__balance">00.00 ₴</span>
      <button class="cab__tool" type="button" title="Notifications">🔔</button>
      <div class="cab__user" title={subtitle || $user?.email || ''}>
        <span class="cab__uid">ID: {$user?.id ?? 1}</span>
        <span class="cab__avatar" aria-hidden="true"></span>
      </div>
      {#if actions}
        <div class="cab__actions">{@render actions()}</div>
      {/if}
      <button class="cab__tool" type="button" onclick={onLogout}>Вийти</button>
    </div>
  </header>

  <main class="cab__main">
    {#if title}<h1 class="cab__sr-only">{title}</h1>{/if}
    {#if banner}<p class="cab__banner">{banner}</p>{/if}
    {#if error}<p class="cab__error">{error}</p>{/if}
    {@render children()}
  </main>

  <footer class="cab__foot">Demo · flowaxy.com</footer>
</div>

<style>
  .cab {
    width: min(1180px, calc(100% - 32px));
    margin: 0 auto;
    padding: 18px 0 28px;
    display: grid;
    gap: 18px;
  }

  .cab__top {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 18px;
    align-items: center;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--cab-border);
  }

  .cab__logo {
    height: 24px;
    width: auto;
    display: block;
  }

  .cab__nav {
    display: flex;
    gap: 16px;
    align-items: center;
    flex-wrap: wrap;
  }

  .cab__nav-link {
    color: var(--cab-muted);
    text-decoration: none;
    font-size: 13px;
    font-weight: 600;
    padding: 6px 0;
    border-bottom: 2px solid transparent;
  }
  .cab__nav-link:hover { color: var(--cab-text); }
  .cab__nav-link.is-active {
    color: var(--cab-text);
    border-bottom-color: var(--cab-text);
  }

  .cab__tools {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .cab__tool {
    height: 32px;
    min-width: 32px;
    padding: 0 8px;
    border: 1px solid var(--cab-border);
    border-radius: 6px;
    background: var(--cab-surface);
    color: var(--cab-muted);
    font: inherit;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
  }
  .cab__tool:hover {
    color: var(--cab-text);
    border-color: #3a4456;
  }

  .cab__balance {
    font-size: 12px;
    font-weight: 700;
    color: var(--cab-text);
    padding: 0 4px;
  }

  .cab__user {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: 4px;
  }
  .cab__uid {
    font-size: 12px;
    color: var(--cab-muted);
    font-weight: 600;
  }
  .cab__avatar {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    background:
      linear-gradient(135deg, #22c55e 0 50%, transparent 50%),
      linear-gradient(315deg, #e2e8f0 0 50%, #16a34a 50%);
    border: 1px solid #2a3140;
  }

  .cab__actions :global(a),
  .cab__actions :global(button) {
    font-size: 12px;
  }

  .cab__main {
    display: grid;
    gap: 16px;
  }

  .cab__banner {
    margin: 0;
    padding: 10px 12px;
    border: 1px solid var(--cab-border);
    border-radius: 6px;
    background: var(--cab-surface);
    color: var(--cab-muted);
    font-size: 13px;
  }

  .cab__error {
    margin: 0;
    color: #fca5a5;
    font-size: 13px;
  }

  .cab__sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    border: 0;
  }

  .cab__foot {
    margin-top: 8px;
    padding-top: 14px;
    border-top: 1px solid var(--cab-border);
    color: #667084;
    font-size: 12px;
  }

  @media (max-width: 900px) {
    .cab__top {
      grid-template-columns: 1fr;
      gap: 12px;
    }
  }
</style>
