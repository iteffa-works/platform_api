<script lang="ts">
  /**
   * Кабінет: шапка-картка (логотип · розділи · інструменти · блоки плагіна · сервіси · меню акаунта),
   * другий ряд вкладок для сторінок акаунта, футер.
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
</script>

<div class="cab">
  <header class="cab__head">
    <div class="cab__row">
      <Brand href="/app" image />
      <span class="cab__divider" aria-hidden="true"></span>
      <nav class="cab__nav" aria-label={$t('nav.cabinet')}>
        {#each mainNav as item (item.href)}
          <a class="cab__tab" class:is-active={item.href === activeHref} href={item.href}>{$t(item.label)}</a>
        {/each}
      </nav>

      <div class="cab__right">
        <div class="cab__tools">
          <ThemeToggle />
          <LanguageSwitcher />
          {#if tools}{@render tools()}{/if}
        </div>

        <Dropdown label={$t('nav.services')} width={280}>
          {#snippet trigger()}<Icon name="apps" size={18} />{/snippet}
          <p class="menu__title">{$t('nav.services')}</p>
          <div class="services">
            {#each services as service (service.href)}
              <a class="services__item" href={service.href} style:--tone="var(--ui-tone-{service.tone})">
                <span class="services__icon"><Icon name={service.icon} size={20} /></span>
                {$t(service.label)}
              </a>
            {/each}
          </div>
        </Dropdown>

        <Dropdown label={$t('nav.accountMenu')} width={260}>
          {#snippet trigger()}
            <span class="cab__id">ID: {$user?.id}</span>
            <Avatar seed={$user?.email ?? ''} src={$user?.avatarUrl} size={30} />
          {/snippet}
          <div class="menu__me">
            <Avatar seed={$user?.email ?? ''} src={$user?.avatarUrl} size={36} />
            <span><strong>{displayName($user)}</strong><small>{$user?.email}</small></span>
          </div>
          <nav class="menu__list">
            {#each accountNav as item (item.href)}
              <a href={item.href}>{#if item.icon}<Icon name={item.icon} />{/if}{$t(item.label)}</a>
            {/each}
            {#if adminHref}<a href={adminHref}><Icon name="shield" />{$t('nav.admin')}</a>{/if}
          </nav>
          <button class="menu__logout" type="button" onclick={signOut}><Icon name="logout" />{$t('auth.signOut')}</button>
        </Dropdown>
      </div>
    </div>

    {#if inAccount}
      <nav class="cab__sub" aria-label={$t('nav.group.account')}>
        {#each accountNav as item (item.href)}
          <a class="cab__subtab" class:is-active={item.href === current} href={item.href}>
            {#if item.icon}<Icon name={item.icon} />{/if}{$t(item.label)}
          </a>
        {/each}
      </nav>
    {/if}
  </header>

  <main class="cab__main">
    <Stack gap="lg">
      {#if title}<h1 class="cab__title">{$t(title)}</h1>{/if}
      {@render children()}
    </Stack>
  </main>

  <footer class="cab__foot">© {year} <strong>{APP_NAME}</strong></footer>
</div>

<style>
  .cab {
    width: min(1170px, calc(100% - 32px));
    margin: 0 auto;
    padding: 20px 0 32px;
  }

  .cab__head,
  .cab__foot {
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius);
    background: var(--ui-surface);
  }

  .cab__row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px 20px;
    padding: 10px 18px;
  }

  .cab__divider {
    width: 1px;
    height: 28px;
    background: var(--ui-border);
  }

  .cab__nav {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .cab__tab {
    padding: 10px 12px;
    border-bottom: 2px solid transparent;
    color: var(--ui-text);
    font-size: 14px;
    font-weight: 500;
    text-decoration: none;
  }

  .cab__tab:hover {
    color: var(--ui-link);
  }

  .cab__tab.is-active {
    border-bottom-color: var(--ui-accent);
  }

  .cab__right {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: auto;
  }

  .cab__tools {
    display: flex;
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius);
  }

  /* Інструменти — одна група з роздільниками (як на референсі) */
  .cab__tools :global(button.ui-theme),
  .cab__tools :global(button.ui-dropdown__trigger) {
    border: 0;
    border-radius: 0;
    background: transparent;
  }

  .cab__tools > :global(*) + :global(*) {
    border-left: 1px solid var(--ui-border);
  }

  .cab__id {
    font-size: 13px;
    font-weight: 600;
    white-space: nowrap;
  }

  /* Другий ряд: вкладки акаунта праворуч */
  .cab__sub {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 4px 22px;
    padding: 0 18px;
    border-top: 1px solid var(--ui-border);
  }

  .cab__subtab {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 0 10px;
    border-bottom: 2px solid transparent;
    color: var(--ui-muted);
    font-size: 14px;
    text-decoration: none;
  }

  .cab__subtab:hover {
    color: var(--ui-text);
  }

  .cab__subtab.is-active {
    border-bottom-color: var(--ui-accent);
    color: var(--ui-text);
    font-weight: 600;
  }

  /* Випадні меню */
  .menu__title {
    margin: 0;
    padding: 14px 16px 4px;
    font-weight: 600;
  }

  .services {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
    padding: 8px 10px 14px;
  }

  .services__item {
    display: grid;
    justify-items: center;
    gap: 8px;
    padding: 10px 4px;
    border-radius: var(--ui-radius);
    color: var(--ui-text);
    font-size: 13px;
    text-decoration: none;
  }

  .services__item:hover {
    background: var(--ui-surface-muted);
  }

  .services__icon {
    display: grid;
    place-items: center;
    width: 46px;
    height: 46px;
    border-radius: 50%;
    background: color-mix(in srgb, var(--tone) 14%, transparent);
    color: var(--tone);
  }

  .menu__me {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
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
    padding: 6px 0;
    border-bottom: 1px solid var(--ui-border);
  }

  .menu__list a,
  .menu__logout {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 16px;
    color: var(--ui-text);
    font: inherit;
    font-size: 14px;
    text-decoration: none;
  }

  .menu__list a:hover,
  .menu__logout:hover {
    background: var(--ui-surface-muted);
  }

  .menu__logout {
    width: 100%;
    margin: 6px 0;
    border: 0;
    background: transparent;
    color: var(--ui-link);
    cursor: pointer;
  }

  .cab__main {
    padding: 20px 0;
  }

  /* Заголовок для читачів екрана: візуально розділ показують вкладки */
  .cab__title {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
  }

  .cab__foot {
    padding: 18px 20px;
    color: var(--ui-muted);
    font-size: 14px;
  }

  .cab__foot strong {
    color: var(--ui-text);
  }

  @media (max-width: 760px) {
    .cab__divider {
      display: none;
    }

    .cab__sub {
      justify-content: flex-start;
    }
  }
</style>
