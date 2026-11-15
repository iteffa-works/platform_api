<script lang="ts">
  /** Адмінка: темна смуга зверху, бічне меню з групами й пошуком, контент */
  import type { Snippet } from 'svelte';
  import { signOut, user } from '$lib/domain/auth';
  import type { TextKey } from '$lib/i18n';
  import { roleName, useI18n } from '$lib/i18n';
  import { ErrorText, LanguageSwitcher, ThemeToggle } from '$lib/ui/components';
  import { Avatar, Brand, Icon, type IconName } from '$lib/ui/elements';
  import { Stack } from '$lib/ui/patterns';

  type Item = { href: string; label: TextKey; icon?: IconName; group?: TextKey; pinned?: boolean };

  let {
    title,
    subtitle,
    error = '',
    nav = [],
    current,
    children,
  }: {
    title?: TextKey;
    subtitle?: TextKey;
    error?: string;
    nav?: Item[];
    current: string;
    children: Snippet;
  } = $props();

  const { t, tx } = useI18n();
  let query = $state('');

  const pinned = $derived(nav.filter((item) => item.pinned));

  /** Групи бічного меню в порядку першої появи; пошук фільтрує за назвою */
  const groups = $derived.by(() => {
    const needle = query.trim().toLowerCase();
    const result = new Map<TextKey, Item[]>();
    for (const item of nav) {
      if (needle && !$t(item.label).toLowerCase().includes(needle)) continue;
      const group = item.group ?? 'nav.group.sections';
      result.set(group, [...(result.get(group) ?? []), item]);
    }
    return [...result];
  });
</script>

<div class="adm">
  <header class="adm__bar">
    <Brand href="/admin" image onDark />
    <nav class="adm__top" aria-label={$t('admin.quickNav')}>
      {#each pinned as item (item.href)}
        <a class="adm__top-link" class:is-active={item.href === current} href={item.href}>
          {#if item.icon}<Icon name={item.icon} />{/if}{$t(item.label)}
        </a>
      {/each}
    </nav>
    <div class="adm__me">
      <LanguageSwitcher />
      <ThemeToggle />
      <a class="adm__top-link" href="/app"><Icon name="home" />{$t('nav.cabinet')}</a>
      <span class="adm__who">
        <Avatar seed={$user?.email ?? ''} src={$user?.avatarUrl} size={28} />
        <span>{roleName($tx, $user?.role)}<small>{$user?.email}</small></span>
      </span>
      <button class="adm__icon" type="button" title={$t('auth.signOut')} aria-label={$t('auth.signOut')} onclick={signOut}>
        <Icon name="logout" />
      </button>
    </div>
  </header>

  <div class="adm__body">
    <aside class="adm__side">
      <label class="adm__search">
        <Icon name="search" />
        <input type="search" placeholder={$t('admin.search')} bind:value={query} aria-label={$t('admin.search')} />
      </label>
      {#each groups as [group, items] (group)}
        <p class="adm__group">{$t(group)}</p>
        {#each items as item (item.href)}
          <a class="adm__link" class:is-active={item.href === current} href={item.href}>
            {#if item.icon}<Icon name={item.icon} />{/if}{$t(item.label)}
          </a>
        {/each}
      {:else}
        <p class="adm__empty">{$t('admin.searchEmpty')}</p>
      {/each}
    </aside>

    <main class="adm__main">
      <Stack gap="lg">
        {#if title}
          <header class="adm__title">
            <h1>{$t(title)}</h1>
            {#if subtitle}<p>{$t(subtitle)}</p>{/if}
          </header>
        {/if}
        <ErrorText message={error} />
        {@render children()}
      </Stack>
    </main>
  </div>
</div>

<style>
  .adm {
    min-height: 100vh;
    display: grid;
    grid-template-rows: auto 1fr;
  }

  .adm__bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px 28px;
    min-height: 52px;
    padding: 0 20px;
    background: var(--ui-bar-bg);
    color: var(--ui-bar-text);
  }

  .adm__top,
  .adm__me {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 18px;
  }

  .adm__me {
    margin-left: auto;
  }

  .adm__top-link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 0;
    color: var(--ui-bar-text);
    font-size: 14px;
    text-decoration: none;
    opacity: 0.85;
  }

  .adm__top-link:hover,
  .adm__top-link.is-active {
    opacity: 1;
  }

  .adm__top-link.is-active {
    box-shadow: inset 0 -2px 0 var(--ui-tone-blue);
  }

  .adm__me :global(.ui-dropdown__trigger) {
    color: var(--ui-bar-text);
  }

  .adm__me :global(.ui-dropdown__trigger:hover) {
    background: rgba(255, 255, 255, 0.08);
  }

  .adm__me :global(.ui-theme) {
    border-color: transparent;
    background: transparent;
    color: var(--ui-bar-muted);
  }

  .adm__who {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
  }

  .adm__who > span {
    display: grid;
    line-height: 1.2;
  }

  .adm__who small {
    color: var(--ui-bar-muted);
    font-size: 12px;
  }

  .adm__icon {
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--ui-bar-muted);
    cursor: pointer;
  }

  .adm__icon:hover {
    color: var(--ui-bar-text);
  }

  .adm__body {
    display: grid;
    grid-template-columns: 240px 1fr;
  }

  .adm__side {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 12px 10px 24px;
    border-right: 1px solid var(--ui-border);
    background: var(--ui-surface);
  }

  .adm__search {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
    padding: 0 10px;
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius);
    color: var(--ui-muted);
  }

  .adm__search input {
    width: 100%;
    height: 34px;
    border: 0;
    outline: none;
    background: transparent;
  }

  .adm__group {
    margin: 12px 0 4px;
    padding: 0 12px;
    color: var(--ui-muted);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .adm__link {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 7px 12px;
    border-left: 2px solid transparent;
    border-radius: 0 var(--ui-radius) var(--ui-radius) 0;
    color: var(--ui-text);
    font-size: 14px;
    text-decoration: none;
  }

  .adm__link:hover {
    background: var(--ui-surface-muted);
  }

  .adm__link.is-active {
    border-left-color: var(--ui-accent);
    background: var(--ui-accent-soft);
    color: var(--ui-link);
    font-weight: 600;
  }

  .adm__empty {
    margin: 8px 12px;
    color: var(--ui-muted);
    font-size: 13px;
  }

  .adm__main {
    width: min(1160px, 100%);
    margin: 0 auto;
    padding: 28px 32px 64px;
  }

  .adm__title h1 {
    font-size: 1.6rem;
  }

  .adm__title p {
    margin: 6px 0 0;
    color: var(--ui-muted);
  }

  /* Вузький екран: швидкі розділи дублюють бічне меню, email — підпис ролі */
  @media (max-width: 760px) {
    .adm__top,
    .adm__who small {
      display: none;
    }

    .adm__me {
      gap: 4px 12px;
    }
  }

  @media (max-width: 900px) {
    .adm__body {
      grid-template-columns: 1fr;
    }

    .adm__side {
      border-right: 0;
      border-bottom: 1px solid var(--ui-border);
    }

    .adm__main {
      padding: 20px 16px 48px;
    }
  }
</style>
