<script lang="ts">
  /**
   * Адмінка — робочий простір: світле бічне меню з групами (згортається в «рейку»),
   * липка верхня панель (хлібні крихти, мова, тема, профіль), шапка сторінки, контент.
   * Контракт пропсів використовує PageHost — не змінювати без нього.
   */
  import type { Snippet } from 'svelte';
  import { afterNavigate } from '$app/navigation';
  import { signOut, user } from '$lib/domain/auth';
  import type { TextKey } from '$lib/i18n';
  import { roleName, useI18n } from '$lib/i18n';
  import { Breadcrumbs, headerTarget, PageHeader, type Crumb } from '$lib/ui/admin';
  import { Dropdown, ErrorText, LanguageSwitcher, ThemeToggle } from '$lib/ui/components';
  import { Avatar, Brand, Icon, type IconName } from '$lib/ui/elements';

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

  /* ---------- Стан оболонки (на пристрій; без сховища — значення за замовчуванням) ---------- */

  const STORE_KEY = 'adm.shell';
  let rail = $state(false);
  let folded = $state<string[]>([]);
  let drawer = $state(false);
  let query = $state('');

  try {
    const saved = JSON.parse(globalThis.localStorage?.getItem(STORE_KEY) ?? 'null');
    if (saved) {
      rail = Boolean(saved.rail);
      folded = Array.isArray(saved.folded) ? saved.folded : [];
    }
  } catch {
    /* приватний режим / SSR */
  }

  function persist() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ rail, folded }));
    } catch {
      /* немає сховища */
    }
  }

  function toggleRail() {
    rail = !rail;
    persist();
  }

  function toggleGroup(group: string) {
    folded = folded.includes(group) ? folded.filter((item) => item !== group) : [...folded, group];
    persist();
  }

  afterNavigate(() => {
    drawer = false;
  });

  /* ---------- Навігація ---------- */

  /** Активний пункт — найдовший префікс шляху (вкладені сторінки підсвічують свій розділ) */
  const active = $derived(
    nav
      .filter((item) => current === item.href || current.startsWith(`${item.href}/`))
      .sort((left, right) => right.href.length - left.href.length)[0],
  );

  /** Групи в порядку першої появи; пошук фільтрує за назвою й розгортає всі групи */
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

  const crumbs = $derived.by(() => {
    const list: Crumb[] = [];
    if (active?.group) list.push({ label: $t(active.group) });
    if (active) list.push({ label: $t(active.label), href: active.href });
    if (title && title !== active?.label) list.push({ label: $t(title) });
    return list;
  });

  const displayName = $derived($user?.name?.trim() || $user?.email || '');

  /** Годинник рядка стану (як у робочих інструментах); оновлюється раз на секунду */
  const timeOf = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  let clock = $state(timeOf());
  $effect(() => {
    const timer = setInterval(() => (clock = timeOf()), 1000);
    return () => clearInterval(timer);
  });
</script>

<!-- Закриті розділи й вхід — не індексувати -->
<svelte:head>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="adm ui-flat" class:is-rail={rail} class:is-drawer={drawer}>
  <aside class="side" aria-label={$t('admin.quickNav')}>
    <div class="side__brand">
      <Brand href={nav[0]?.href ?? '/admin'} image />
      <button class="side__rail" type="button" onclick={toggleRail} aria-pressed={rail} aria-label="Sidebar" title="Sidebar">
        <Icon name={rail ? 'chevrons-right' : 'chevrons-left'} />
      </button>
    </div>

    <label class="side__search">
      <Icon name="search" />
      <input type="search" placeholder={$t('admin.search')} bind:value={query} aria-label={$t('admin.search')} />
    </label>

    <nav class="side__nav">
      {#each groups as [group, items] (group)}
        {@const open = Boolean(query.trim()) || !folded.includes(group)}
        <div class="side__group">
          <button class="side__group-head" type="button" aria-expanded={open} onclick={() => toggleGroup(group)}>
            <span>{$t(group)}</span>
            <Icon name="chevron-down" size={14} />
          </button>
          {#if open || rail}
            <ul>
              {#each items as item (item.href)}
                <li>
                  <a
                    class="side__link"
                    class:is-active={item === active}
                    href={item.href}
                    title={rail ? $t(item.label) : undefined}
                    aria-current={item === active ? 'page' : undefined}
                  >
                    <span class="side__icon">{#if item.icon}<Icon name={item.icon} size={18} />{/if}</span>
                    <span class="side__label">{$t(item.label)}</span>
                  </a>
                </li>
              {/each}
            </ul>
          {/if}
        </div>
      {:else}
        <p class="side__empty">{$t('admin.searchEmpty')}</p>
      {/each}
    </nav>

    <a class="side__link side__foot" href="/app" title={rail ? $t('nav.cabinet') : undefined}>
      <span class="side__icon"><Icon name="home" size={18} /></span>
      <span class="side__label">{$t('nav.cabinet')}</span>
    </a>
  </aside>

  <button class="scrim" type="button" tabindex="-1" aria-hidden="true" onclick={() => (drawer = false)}></button>

  <div class="main">
    <header class="top">
      <button class="top__burger" type="button" onclick={() => (drawer = true)} aria-label={$t('admin.quickNav')}>
        <Icon name="menu" size={18} />
      </button>
      <Breadcrumbs items={crumbs} />

      <div class="top__tools">
        <LanguageSwitcher />
        <ThemeToggle />
        <span class="top__sep" aria-hidden="true"></span>
        <Dropdown label={displayName} width={220}>
          {#snippet trigger()}
            <span class="me">
              <span class="me__text">
                <b>{displayName}</b>
                <small>{roleName($tx, $user?.role)}</small>
              </span>
              <Avatar seed={$user?.email ?? ''} src={$user?.avatarUrl} size={32} />
            </span>
          {/snippet}
          <div class="menu">
            <p class="menu__who">{$user?.email}</p>
            <a class="menu__item" href="/app"><Icon name="home" />{$t('nav.cabinet')}</a>
            <button class="menu__item" type="button" onclick={signOut}><Icon name="logout" />{$t('auth.signOut')}</button>
          </div>
        </Dropdown>
      </div>
    </header>

    <main class="content">
      {#if title}
        <PageHeader title={$t(title)} subtitle={subtitle ? $t(subtitle) : undefined}>
          {#snippet actions()}<div class="head-slot" use:headerTarget></div>{/snippet}
        </PageHeader>
      {/if}
      <ErrorText message={error} />
      {@render children()}
    </main>

    <footer class="status" aria-live="off">
      <span class="status__path">{crumbs.map((crumb) => crumb.label).join(' · ')}</span>
      <span class="status__live">{$t('admin.online')} · {roleName($tx, $user?.role)} · {clock}</span>
    </footer>
  </div>
</div>

<style lang="scss">
  /* Токени стилю — клас `ui-flat` (styles/flat.css), спільний з кабінетом */
  .adm {
    --side-w: var(--ui-sidebar-w);

    display: grid;
    grid-template-columns: var(--side-w) minmax(0, 1fr);
    min-height: 100vh;
    background: var(--ui-app-bg);
    font-size: var(--ui-fs-md);
    transition: grid-template-columns 0.2s ease;

    &.is-rail {
      --side-w: var(--ui-sidebar-rail);
    }
  }

  /* ---------- Бічне меню ---------- */

  .side {
    position: sticky;
    top: 0;
    z-index: 30;
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
    border-right: 1px solid var(--ui-border);
    background: var(--ui-app-bg);
  }

  .side__brand {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: space(2);
    height: var(--ui-topbar-h);
    padding: 0 space(3) 0 space(4);
    border-bottom: 1px solid var(--ui-border);

    :global(.ui-brand) {
      min-width: 0;
      overflow: hidden;
    }
  }

  .side__rail {
    @include icon-button(28px);
  }

  .side__search {
    @include control;
    margin: space(3) space(3) space(1);
    color: var(--ui-muted);

    input {
      width: 100%;
      min-width: 0;
      border: 0;
      outline: none;
      background: transparent;
      font-size: var(--ui-fs-sm);
    }
  }

  .side__nav {
    flex: 1;
    overflow-y: auto;
    padding: space(1) space(3) space(4);
    @include thin-scrollbar;
  }

  .side__group {
    margin-top: space(4);

    ul {
      display: grid;
      gap: 6px;
      margin: 0;
      padding: 0;
      list-style: none;
    }
  }

  .side__group-head {
    @include reset-button;
    @include eyebrow;
    @include focus-ring(0);
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    margin-bottom: space(2);
    padding: space(1) 2px;
    border-radius: var(--ui-radius-sm);
    color: var(--ui-text-2);
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;

    :global(.ui-icon) {
      transition: transform 0.15s;
    }

    &[aria-expanded='false'] :global(.ui-icon) {
      transform: rotate(-90deg);
    }

    &:hover {
      color: var(--ui-text);
    }
  }

  .side__link {
    @include focus-ring(-2px);
    position: relative;
    display: flex;
    align-items: center;
    gap: space(3);
    height: 34px;
    padding: 0 space(3);
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius-md);
    background: var(--ui-surface);
    color: var(--ui-text-2);
    font-size: var(--ui-fs-md);
    text-decoration: none;
    white-space: nowrap;
    transition: border-color 0.12s, background 0.12s, color 0.12s;

    &:hover {
      border-color: var(--ui-border-strong);
      background: var(--ui-surface-muted);
      color: var(--ui-text);
    }

    // Активний пункт: червона смуга зліва всередині плитки
    &.is-active {
      border-color: color-mix(in srgb, var(--ui-accent) 45%, var(--ui-border));
      background: var(--ui-nav-active);
      color: var(--ui-text);
      font-weight: 600;

      &::before {
        content: '';
        position: absolute;
        top: 7px;
        bottom: 7px;
        left: 7px;
        width: 2px;
        background: var(--ui-accent);
      }

      .side__icon {
        color: var(--ui-accent);
        opacity: 1;
      }
    }
  }

  .side__icon {
    display: grid;
    flex: none;
    place-items: center;
    width: 20px;
    color: inherit;
    opacity: 0.85;
  }

  .side__label {
    @include truncate;
  }

  .side__foot {
    margin: 0 space(3) space(3);
  }

  .side__empty {
    margin: space(3) space(2);
    color: var(--ui-muted);
    font-size: var(--ui-fs-sm);
  }

  // Рейка: лише іконки, підписи — у title
  .is-rail {
    .side__brand {
      justify-content: center;
      padding: 0;

      :global(.ui-brand) {
        display: none;
      }
    }

    .side__search,
    .side__group-head,
    .side__label {
      display: none;
    }

    .side__nav {
      padding-inline: space(2) + 2px;
    }

    .side__group {
      margin-top: space(2);
      padding-top: space(2);
      border-top: 1px solid var(--ui-border-soft);

      &:first-child {
        border-top: 0;
      }
    }

    .side__link {
      justify-content: center;
      padding: 0;

      &.is-active::before {
        left: 4px;
      }
    }

    .side__foot {
      margin-inline: space(2) + 2px;
    }
  }

  .scrim {
    display: none;
  }

  /* ---------- Верхня панель ---------- */

  .main {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .top {
    position: sticky;
    top: 0;
    z-index: 20;
    display: flex;
    align-items: center;
    gap: space(3);
    height: var(--ui-topbar-h);
    padding: 0 space(6);
    border-bottom: 1px solid var(--ui-border);
    background: var(--ui-app-bg);
  }

  .top__burger {
    @include icon-button;
    display: none;
  }

  .top__tools {
    display: flex;
    align-items: center;
    gap: space(1);
    margin-left: auto;

    :global(.ui-theme) {
      border-color: transparent;
      background: transparent;
      color: var(--ui-muted);
    }
  }

  .top__sep {
    width: 1px;
    height: 24px;
    margin: 0 space(2);
    background: var(--ui-border-soft);
  }

  .me {
    display: flex;
    align-items: center;
    gap: space(2) + 2px;
    text-align: right;

    :global(.ui-avatar) {
      border-radius: 50%;
    }
  }

  .me__text {
    display: grid;
    line-height: 1.2;

    b {
      max-width: 180px;
      font-size: var(--ui-fs-sm);
      font-weight: 600;
      @include truncate;
    }

    small {
      color: var(--ui-muted);
      font-size: var(--ui-fs-xs);
    }
  }

  .menu {
    display: grid;
    gap: 2px;
    padding: space(1);
  }

  .menu__who {
    margin: 0 0 space(1);
    padding: space(2);
    border-bottom: 1px solid var(--ui-border-soft);
    color: var(--ui-muted);
    font-size: var(--ui-fs-xs);
    overflow-wrap: anywhere;
  }

  .menu__item {
    @include reset-button;
    @include focus-ring(-2px);
    display: flex;
    align-items: center;
    gap: space(2) + 2px;
    padding: space(2);
    border-radius: var(--ui-radius-sm);
    font-size: var(--ui-fs-sm);
    text-decoration: none;

    &:hover {
      background: var(--ui-surface-muted);
    }
  }

  /* ---------- Контент ---------- */

  .head-slot {
    display: contents;
  }

  .content {
    display: flex;
    flex-direction: column;
    flex: 1;
    gap: space(4);
    width: 100%;
    max-width: 1600px;
    margin: 0 auto;
    padding: space(5) space(6) space(8);
  }

  /* Шапка сторінки: назва й дії, під нею — червона лінія розділу (як у робочих інструментах) */
  .content > :global(.head) {
    padding-bottom: space(3);
    border-bottom: 2px solid var(--ui-accent);
  }

  /* ---------- Рядок стану (як у робочих інструментах) ---------- */

  .status {
    position: sticky;
    bottom: 0;
    z-index: 15;
    display: flex;
    align-items: center;
    gap: space(3);
    height: 26px;
    padding: 0 space(6);
    border-top: 1px solid var(--ui-border);
    background: var(--ui-app-bg);
    color: var(--ui-muted);
    font-size: var(--ui-fs-xs);
    font-variant-numeric: tabular-nums;
  }

  .status__path {
    @include truncate;
  }

  .status__live {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-left: auto;
    color: var(--ui-success);
    white-space: nowrap;

    &::before {
      content: '';
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
    }
  }

  /* ---------- Вузький екран: меню — висувна панель ---------- */

  @include down(lg) {
    .adm,
    .adm.is-rail {
      --side-w: var(--ui-sidebar-w);
      grid-template-columns: minmax(0, 1fr);
    }

    .side {
      position: fixed;
      inset: 0 auto 0 0;
      width: min(var(--ui-sidebar-w), 86vw);
      box-shadow: var(--ui-shadow-pop);
      transform: translateX(-105%);
      transition: transform 0.2s ease;
    }

    .is-drawer .side {
      transform: none;
    }

    .side__rail {
      display: none;
    }

    // У висувній панелі рейка не діє
    .is-rail {
      .side__brand {
        justify-content: space-between;
        padding: 0 space(3) 0 space(4);

        :global(.ui-brand) {
          display: inline-flex;
        }
      }

      .side__search {
        display: inline-flex;
      }

      .side__group-head {
        display: flex;
      }

      .side__label {
        display: inline;
      }

      .side__link {
        justify-content: flex-start;
        padding: 0 space(2) + 2px;
      }
    }

    .is-drawer .scrim {
      position: fixed;
      inset: 0;
      z-index: 25;
      display: block;
      border: 0;
      background: rgba(15, 23, 42, 0.4);
    }

    .main {
      grid-column: 1;
    }

    .top {
      padding: 0 space(4);
    }

    .top__burger {
      display: inline-grid;
    }

    .content {
      padding: space(4) space(4) space(8);
    }

    .status {
      padding: 0 space(4);
    }
  }

  @include down(md) {
    .me__text,
    .top__sep {
      display: none;
    }

    .top :global(.crumbs) {
      display: none;
    }
  }
</style>
