<script lang="ts">
  /**
   * Кабінет у плаському корпоративному стилі (токени `ui-flat`, як в адмінці): смуга шапки на всю ширину
   * (логотип · розділи · інструменти · блоки плагіна · сервіси · меню акаунта), другий ряд — вкладки акаунта,
   * вміст по центру, рядок стану внизу.
   */
  import type { Snippet } from 'svelte';
  import { APP_NAME } from '$lib/config';
  import { displayName, signOut, user } from '$lib/domain/auth';
  import { useI18n, type TextKey } from '$lib/i18n';
  import { Dropdown, LanguageSwitcher, ThemeToggle } from '$lib/ui/components';
  import { Avatar, Brand, Icon, type IconName } from '$lib/ui/elements';
  import { Stack } from '$lib/ui/patterns';

  type Item = { href: string; label: TextKey; icon?: IconName; group?: TextKey };

  let {
    title,
    nav = [],
    current,
    adminHref = null,
    extraServices = [],
    tools,
    children,
  }: {
    title?: TextKey;
    nav?: Item[];
    current: string;
    adminHref?: string | null;
    /** Сервіси плагінів (хостинг, …) */
    extraServices?: Array<{ href: string; label: TextKey; icon: IconName; tone: string }>;
    /** Блоки плагіна в шапці (баланс, сповіщення) */
    tools?: Snippet;
    children: Snippet;
  } = $props();

  const { t } = useI18n();

  /** Пункти групи `nav.group.account` — вкладки другого ряду й меню акаунта */
  const ACCOUNT = 'nav.group.account';
  const mainNav = $derived(nav.filter((item) => item.group !== ACCOUNT));
  const accountNav = $derived(nav.filter((item) => item.group === ACCOUNT));
  const inAccount = $derived(accountNav.some((item) => item.href === current));

  const services = $derived([
    { href: '/app', label: 'nav.cabinet' as const, icon: 'dashboard' as const, tone: 'purple' },
    ...(adminHref ? [{ href: adminHref, label: 'nav.admin' as const, icon: 'shield' as const, tone: 'blue' }] : []),
    ...extraServices,
  ]);

  /** Активна вкладка — найдовший збіг: /app/hosting підсвічується і на /app/hosting/12 */
  const activeHref = $derived(
    nav.map((item) => item.href)
      .filter((href) => href === current || (href !== '/app' && current.startsWith(`${href}/`)))
      .sort((left, right) => right.length - left.length)[0] ?? null,
  );

  const year = new Date().getFullYear();

  /** Годинник рядка стану (як в адмінці); оновлюється раз на секунду */
  const timeOf = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  let clock = $state(timeOf());
  $effect(() => {
    const timer = setInterval(() => (clock = timeOf()), 1000);
    return () => clearInterval(timer);
  });

  /** Поточний розділ для рядка стану */
  const currentLabel = $derived(nav.find((item) => item.href === activeHref)?.label);
</script>

<!-- Закриті розділи й вхід — не індексувати -->
<svelte:head>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="cab ui-flat">
  <header class="cab__head">
    <div class="cab__row">
      <Brand href="/app" image />
      <span class="cab__divider" aria-hidden="true"></span>
      <nav class="cab__nav" aria-label={$t('nav.cabinet')}>
        {#each mainNav as item (item.href)}
          <a class="cab__tab" class:is-active={item.href === activeHref} href={item.href} aria-current={item.href === activeHref ? 'page' : undefined}>{$t(item.label)}</a>
        {/each}
      </nav>

      <div class="cab__right">
        <div class="cab__tools">
          <ThemeToggle />
          <LanguageSwitcher />
          {#if tools}{@render tools()}{/if}
        </div>

        {#if adminHref}
          <a class="cab__admin" href={adminHref} title={$t('nav.admin')} aria-label={$t('nav.admin')}>
            <Icon name="shield" size={18} />
          </a>
        {/if}

        <Dropdown label={$t('nav.services')} width={280}>
          {#snippet trigger()}<Icon name="apps" size={18} />{/snippet}
          <p class="menu__title">{$t('nav.services')}</p>
          <div class="services">
            {#each services as service (service.href)}
              <a class="services__item" href={service.href} style:--tone="var(--ui-tone-{service.tone})">
                <span class="services__icon"><Icon name={service.icon} size={18} /></span>
                {$t(service.label)}
              </a>
            {/each}
          </div>
        </Dropdown>

        <Dropdown label={$t('nav.accountMenu')} width={260}>
          {#snippet trigger()}
            <span class="cab__id">ID: {$user?.id}</span>
            <Avatar seed={$user?.email ?? ''} src={$user?.avatarUrl} size={28} />
          {/snippet}
          <div class="menu__me">
            <Avatar seed={$user?.email ?? ''} src={$user?.avatarUrl} size={34} />
            <span><strong>{displayName($user)}</strong><small>{$user?.email}</small></span>
          </div>
          <nav class="menu__list">
            {#each accountNav as item (item.href)}
              <a href={item.href}>{#if item.icon}<Icon name={item.icon} />{/if}{$t(item.label)}</a>
            {/each}
          </nav>
          <button class="menu__logout" type="button" onclick={signOut}><Icon name="logout" />{$t('auth.signOut')}</button>
        </Dropdown>
      </div>
    </div>

    {#if inAccount}
      <nav class="cab__sub" aria-label={$t('nav.group.account')}>
        <div class="cab__inner cab__subrow">
          {#each accountNav as item (item.href)}
            <a class="cab__subtab" class:is-active={item.href === current} href={item.href} aria-current={item.href === current ? 'page' : undefined}>
              {#if item.icon}<Icon name={item.icon} />{/if}{$t(item.label)}
            </a>
          {/each}
        </div>
      </nav>
    {/if}
  </header>

  <main class="cab__main cab__inner">
    <Stack gap="lg">
      {#if title}<h1 class="cab__title">{$t(title)}</h1>{/if}
      {@render children()}
    </Stack>
  </main>

  <footer class="cab__status">
    <span class="cab__path">© {year} <strong>{APP_NAME}</strong>{#if currentLabel} · {$t(currentLabel)}{/if}</span>
    <span class="cab__live">{$t('admin.online')} · {clock}</span>
  </footer>
</div>

<style>
  /* Тло й токени — `ui-flat` (styles/flat.css), спільні з адмінкою */
  .cab {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background: var(--ui-app-bg);
    color: var(--ui-text);
    font-size: var(--ui-fs-md);
  }

  .cab__inner {
    width: min(1240px, calc(100% - 32px));
    margin: 0 auto;
  }

  /* ---------- Шапка: смуга на всю ширину ---------- */

  .cab__head {
    position: sticky;
    top: 0;
    z-index: 20;
    border-bottom: 1px solid var(--ui-border);
    background: var(--ui-app-bg);
  }

  .cab__row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 18px;
    width: min(1240px, calc(100% - 32px));
    min-height: var(--ui-topbar-h);
    margin: 0 auto;
  }

  .cab__divider {
    width: 1px;
    height: 22px;
    background: var(--ui-border);
  }

  .cab__nav {
    display: flex;
    flex-wrap: wrap;
    align-self: stretch;
    gap: 2px;
  }

  /* Вкладка розділу: активна — червона лінія знизу (як вкладки в адмінці) */
  .cab__tab {
    display: inline-flex;
    align-items: center;
    padding: 0 12px;
    box-shadow: inset 0 -2px 0 transparent;
    color: var(--ui-text-2);
    font-size: var(--ui-fs-md);
    font-weight: 600;
    text-decoration: none;
    transition: color 0.12s, box-shadow 0.12s;
  }

  .cab__tab:hover {
    color: var(--ui-text);
  }

  .cab__tab.is-active {
    box-shadow: inset 0 -2px 0 var(--ui-accent);
    color: var(--ui-text);
  }

  .cab__right {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: auto;
  }

  /* Інструменти — одна група з роздільниками */
  .cab__tools {
    display: flex;
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius-md);
    background: var(--ui-surface);
  }

  .cab__tools :global(button.ui-theme),
  .cab__tools :global(button.ui-dropdown__trigger) {
    border: 0;
    border-radius: 0;
    background: transparent;
  }

  .cab__tools > :global(*) + :global(*) {
    border-left: 1px solid var(--ui-border);
  }

  /* Вхід в адмінку — іконка поруч із сервісами (такий самий вигляд, як кнопка «Сервіси») */
  .cab__admin {
    display: inline-grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border-radius: var(--ui-radius);
    color: inherit;
    text-decoration: none;
  }

  .cab__admin:hover {
    background: var(--ui-surface-muted);
  }

  .cab__id {
    color: var(--ui-muted);
    font-size: var(--ui-fs-sm);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  /* ---------- Другий ряд: вкладки акаунта ---------- */

  .cab__sub {
    border-top: 1px solid var(--ui-border-soft);
    background: var(--ui-surface);
  }

  .cab__subrow {
    display: flex;
    flex-wrap: wrap;
    gap: 2px 4px;
  }

  .cab__subtab {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 9px 12px 8px;
    box-shadow: inset 0 -2px 0 transparent;
    color: var(--ui-muted);
    font-size: var(--ui-fs-sm);
    text-decoration: none;
  }

  .cab__subtab:hover {
    color: var(--ui-text);
  }

  .cab__subtab.is-active {
    box-shadow: inset 0 -2px 0 var(--ui-accent);
    color: var(--ui-text);
    font-weight: 600;
  }

  .cab__subtab.is-active :global(.ui-icon) {
    color: var(--ui-accent);
  }

  /* ---------- Випадні меню ---------- */

  .menu__title {
    margin: 0;
    padding: 12px 14px 4px;
    color: var(--ui-text-2);
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .services {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
    padding: 6px 8px 10px;
  }

  .services__item {
    display: grid;
    justify-items: center;
    gap: 6px;
    padding: 10px 4px;
    border: 1px solid transparent;
    border-radius: var(--ui-radius-md);
    color: var(--ui-text);
    font-size: var(--ui-fs-sm);
    text-decoration: none;
  }

  .services__item:hover {
    border-color: var(--ui-border);
    background: var(--ui-surface-muted);
  }

  .services__icon {
    display: grid;
    place-items: center;
    width: 38px;
    height: 38px;
    border: 1px solid color-mix(in srgb, var(--tone) 40%, transparent);
    border-radius: var(--ui-radius-md);
    background: color-mix(in srgb, var(--tone) 8%, transparent);
    color: var(--tone);
  }

  .menu__me {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    border-bottom: 1px solid var(--ui-border);
  }

  .menu__me > span {
    display: grid;
    min-width: 0;
  }

  .menu__me small {
    overflow: hidden;
    color: var(--ui-muted);
    text-overflow: ellipsis;
  }

  .menu__list {
    display: grid;
    padding: 4px 0;
    border-bottom: 1px solid var(--ui-border);
  }

  .menu__list a,
  .menu__logout {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 14px;
    color: var(--ui-text);
    font: inherit;
    font-size: var(--ui-fs-md);
    text-decoration: none;
  }

  .menu__list a:hover,
  .menu__logout:hover {
    background: var(--ui-surface-muted);
  }

  .menu__logout {
    width: 100%;
    margin: 4px 0;
    border: 0;
    background: transparent;
    color: var(--ui-accent);
    cursor: pointer;
  }

  /* ---------- Вміст ---------- */

  .cab__main {
    flex: 1;
    padding: 20px 0 28px;
  }

  /* Заголовок для читачів екрана: візуально розділ показують вкладки */
  .cab__title {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
  }

  /* ---------- Рядок стану ---------- */

  .cab__status {
    position: sticky;
    bottom: 0;
    z-index: 15;
    display: flex;
    align-items: center;
    gap: 12px;
    height: 26px;
    padding: 0 max(16px, calc((100% - 1240px) / 2));
    border-top: 1px solid var(--ui-border);
    background: var(--ui-app-bg);
    color: var(--ui-muted);
    font-size: var(--ui-fs-xs);
    font-variant-numeric: tabular-nums;
  }

  .cab__path {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .cab__path strong {
    color: var(--ui-text-2);
  }

  .cab__live {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-left: auto;
    color: var(--ui-success);
    white-space: nowrap;
  }

  .cab__live::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
  }

  @media (max-width: 760px) {
    .cab__divider,
    .cab__id {
      display: none;
    }

    .cab__nav {
      order: 3;
      width: 100%;
      overflow-x: auto;
    }

    .cab__tab {
      padding: 10px 12px;
    }
  }

  /* Телефон: інструменти переносяться, рядок стану — лише головне */
  @media (max-width: 480px) {
    .cab__right {
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    .cab__path {
      display: none;
    }
  }
</style>
