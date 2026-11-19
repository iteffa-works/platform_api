<script lang="ts">
  /**
   * Шаблон головної (хостинг) у плаському корпоративному стилі (`ui-flat`, як адмінка й кабінет):
   * смуга шапки з навігацією секціями, секції, футер. Спільні класи секцій — `lp-*` (нижче).
   */
  import type { Snippet } from 'svelte';
  import { APP_NAME, APP_ORIGIN } from '$lib/config';
  import { useI18n } from '$lib/i18n';
  import { LanguageSwitcher, ThemeToggle } from '$lib/ui/components';
  import { Brand, Icon } from '$lib/ui/elements';

  let { actions, children }: { actions?: Snippet; children: Snippet } = $props();

  const { t, locale } = useI18n();

  const nav = [
    { href: '#plans', label: 'landing.nav.plans' },
    { href: '#features', label: 'landing.nav.features' },
    { href: '#compare', label: 'landing.nav.compare' },
    { href: '#faq', label: 'landing.nav.faq' },
  ] as const;

  const year = new Date().getFullYear();

  /** Мобільне меню (бургер): закривається після переходу до розділу */
  let menu = $state(false);

  const title = $derived(`${APP_NAME} — ${$t('landing.seo.title')}`);
  const description = $derived($t('landing.seo.description'));
  /** Структуровані дані: організація й сайт (тарифи — у блоці тарифів, коли завантажаться) */
  const jsonLd = $derived(JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'Organization', name: APP_NAME, url: `${APP_ORIGIN}/`, logo: `${APP_ORIGIN}/brand/logo_light.png` },
      { '@type': 'WebSite', name: APP_NAME, url: `${APP_ORIGIN}/`, inLanguage: $locale, description },
    ],
  }).replace(/</g, '\\u003c'));
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <meta name="robots" content="index, follow, max-image-preview:large" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content={APP_NAME} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:url" content="{APP_ORIGIN}/" />
  <meta property="og:image" content="{APP_ORIGIN}/brand/logo_light.png" />
  <meta property="og:locale" content={$locale === 'uk' ? 'uk_UA' : $locale === 'ru' ? 'ru_UA' : 'en_US'} />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content={title} />
  <meta name="twitter:description" content={description} />
  {@html `<script type="application/ld+json">${jsonLd}</script>`}
</svelte:head>

<div class="site ui-flat">
  <header class="site__header">
    <div class="ui-container site__bar">
      <Brand image />
      <span class="site__divider" aria-hidden="true"></span>
      <nav class="site__nav" aria-label={$t('landing.nav.label')}>
        {#each nav as item (item.href)}
          <a href={item.href}>{$t(item.label)}</a>
        {/each}
      </nav>
      <div class="site__actions">
        <button class="site__burger" type="button" aria-expanded={menu} aria-controls="site-menu" aria-label={$t('landing.nav.label')} onclick={() => (menu = !menu)}>
          <Icon name={menu ? 'close' : 'menu'} size={18} />
        </button>
        <div class="site__tools">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
        {#if actions}{@render actions()}{/if}
      </div>
    </div>
    {#if menu}
      <nav class="site__menu" id="site-menu" aria-label={$t('landing.nav.label')}>
        <div class="ui-container">
          {#each nav as item (item.href)}
            <a href={item.href} onclick={() => (menu = false)}>{$t(item.label)}</a>
          {/each}
        </div>
      </nav>
    {/if}
  </header>

  <main>{@render children()}</main>

  <footer class="site__footer">
    <div class="ui-container site__footer-row">
      <span>© {year} <strong>{APP_NAME}</strong> · {$t('landing.footer.tagline')}</span>
      <nav class="site__footer-nav" aria-label={$t('landing.nav.footer')}>
        {#each nav as item (item.href)}
          <a href={item.href}>{$t(item.label)}</a>
        {/each}
        <a href="/login">{$t('auth.signIn')}</a>
      </nav>
    </div>
  </footer>
</div>

<style>
  .site {
    display: grid;
    grid-template-rows: auto 1fr auto;
    min-height: 100vh;
    background: var(--ui-app-bg);
    color: var(--ui-text);
    font-size: 14px;
    --ui-site-width: min(1200px, calc(100% - 32px));
  }

  /* ---------- Шапка ---------- */

  .site__header {
    position: sticky;
    top: 0;
    z-index: 10;
    border-bottom: 1px solid var(--ui-border);
    background: var(--ui-app-bg);
  }

  .site__bar {
    display: flex;
    align-items: center;
    gap: 18px;
    height: 56px;
  }

  .site__divider {
    width: 1px;
    height: 22px;
    background: var(--ui-border);
  }

  .site__nav {
    display: flex;
    align-self: stretch;
    gap: 2px;
  }

  .site__nav a {
    display: inline-flex;
    align-items: center;
    padding: 0 12px;
    box-shadow: inset 0 -2px 0 transparent;
    color: var(--ui-text-2);
    font-weight: 600;
    text-decoration: none;
    transition: color 0.12s, box-shadow 0.12s;
  }

  .site__nav a:hover {
    box-shadow: inset 0 -2px 0 var(--ui-accent);
    color: var(--ui-text);
  }

  .site__actions {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: auto;
  }

  .site__tools {
    display: flex;
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius-md);
    background: var(--ui-surface);
  }

  .site__tools :global(button.ui-theme),
  .site__tools :global(button.ui-dropdown__trigger) {
    border: 0;
    border-radius: 0;
    background: transparent;
  }

  .site__tools > :global(*) + :global(*) {
    border-left: 1px solid var(--ui-border);
  }

  /* Бургер і мобільне меню — лише на вузьких екранах */
  .site__burger {
    display: none;
    place-items: center;
    width: 34px;
    height: 34px;
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius-md);
    background: var(--ui-surface);
    color: var(--ui-text);
    cursor: pointer;
  }

  .site__menu {
    border-top: 1px solid var(--ui-border);
    background: var(--ui-app-bg);
  }

  .site__menu .ui-container {
    display: grid;
    padding: 6px 0 10px;
  }

  .site__menu a {
    padding: 11px 4px;
    border-bottom: 1px solid var(--ui-border-soft);
    color: var(--ui-text);
    font-weight: 600;
    text-decoration: none;
  }

  .site__menu a:last-child {
    border-bottom: 0;
  }

  /* ---------- Футер ---------- */

  .site__footer {
    border-top: 1px solid var(--ui-border);
  }

  .site__footer-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 22px 0;
    color: var(--ui-muted);
    font-size: 13px;
  }

  .site__footer-row strong {
    color: var(--ui-text);
  }

  .site__footer-nav {
    display: flex;
    flex-wrap: wrap;
    gap: 18px;
  }

  .site__footer-nav a {
    color: var(--ui-muted);
    text-decoration: none;
  }

  .site__footer-nav a:hover {
    color: var(--ui-text);
  }

  /* ---------- Спільне для секцій головної ---------- */

  .site :global(.lp-section) {
    padding: 64px 0;
    border-bottom: 1px solid var(--ui-border);
    scroll-margin-top: 56px;
  }

  .site :global(.lp-head) {
    display: grid;
    gap: 8px;
    max-width: 720px;
    margin-bottom: 28px;
  }

  .site :global(.lp-eyebrow) {
    margin: 0;
    color: var(--ui-accent);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .site :global(.lp-title) {
    margin: 0;
    font-size: clamp(24px, 3vw, 32px);
    font-weight: 800;
    line-height: 1.15;
  }

  .site :global(.lp-lead) {
    margin: 0;
    color: var(--ui-muted);
    font-size: 15px;
    line-height: 1.6;
  }

  @media (max-width: 860px) {
    .site__nav,
    .site__divider {
      display: none;
    }

    .site__burger {
      display: inline-grid;
      order: 2;
    }

    .site :global(.lp-section) {
      padding: 44px 0;
    }
  }

  @media (min-width: 861px) {
    .site__menu {
      display: none;
    }
  }

  /* Телефон: інструменти (тема, мова) — компактно; «Увійти» лишається в hero */
  @media (max-width: 480px) {
    .site__bar {
      gap: 10px;
    }


    .site__actions :global(.ui-btn.is-ghost) {
      display: none;
    }
  }
</style>
