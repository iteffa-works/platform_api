<script lang="ts">
  /** Кабінет: темна оболонка з навігацією плагіна */
  import type { Snippet } from 'svelte';
  import { signOut, user } from '$lib/domain/auth';
  import { Brand } from '$lib/ui/elements';
  import { NavTabs, Stack } from '$lib/ui/patterns';

  type Item = { href: string; label: string };

  let {
    title = '',
    nav = [],
    current,
    adminHref = null,
    children,
  }: {
    title?: string;
    nav?: Item[];
    current: string;
    adminHref?: string | null;
    children: Snippet;
  } = $props();
</script>

<div class="cab">
  <header class="cab__top">
    <div class="cab__bar">
      <Brand href="/app" />
      <NavTabs items={nav} {current} />
      <div class="cab__user">
        <span class="cab__who">{$user?.email}<small>{$user?.role.name}</small></span>
        {#if adminHref}<a class="cab__link" href={adminHref}>Адмінка</a>{/if}
        <button class="cab__link" type="button" onclick={signOut}>Вийти</button>
      </div>
    </div>
  </header>

  <main class="cab__main">
    <Stack gap="lg">
      {#if title}<h1 class="cab__title">{title}</h1>{/if}
      {@render children()}
    </Stack>
  </main>
</div>

<style>
  .cab {
    min-height: 100vh;
    background: var(--ui-page-bg);
  }

  .cab__top {
    border-bottom: 1px solid var(--ui-border);
    background: var(--ui-surface);
  }

  .cab__bar,
  .cab__main {
    width: min(1120px, calc(100% - 32px));
    margin: 0 auto;
  }

  .cab__bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px 32px;
    min-height: 60px;
  }

  .cab__user {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-left: auto;
    font-size: 14px;
  }

  .cab__who {
    display: grid;
    text-align: right;
  }

  .cab__who small {
    color: var(--ui-muted);
  }

  .cab__link {
    padding: 0;
    border: 0;
    background: none;
    color: var(--ui-link);
    font: inherit;
    font-weight: 600;
    text-decoration: none;
    cursor: pointer;
  }

  .cab__main {
    padding: 28px 0 64px;
  }

  .cab__title {
    margin: 0;
    font-size: 1.5rem;
  }
</style>
