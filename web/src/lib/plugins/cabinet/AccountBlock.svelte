<script lang="ts">
  /** Акаунт: вкладки — основна інформація, персональні дані, програма лояльності, SSH-ключі (`?tab=`) */
  import { page as route } from '$app/stores';
  import { useI18n, type MessageKey } from '$lib/i18n';
  import LoyaltyTab from './account/LoyaltyTab.svelte';
  import MainTab from './account/MainTab.svelte';
  import PersonalTab from './account/PersonalTab.svelte';
  import SshTab from './account/SshTab.svelte';

  const { t } = useI18n();

  const TABS = [
    { id: 'main', label: 'account.tab.main', component: MainTab },
    { id: 'personal', label: 'account.tab.personal', component: PersonalTab },
    { id: 'loyalty', label: 'account.tab.loyalty', component: LoyaltyTab },
    { id: 'ssh', label: 'account.tab.ssh', component: SshTab },
  ] as const satisfies readonly { id: string; label: MessageKey; component: unknown }[];

  const active = $derived(TABS.find((tab) => tab.id === $route.url.searchParams.get('tab')) ?? TABS[0]);
</script>

<nav class="tabs" aria-label={$t('nav.account')}>
  {#each TABS as tab (tab.id)}
    <a
      href={tab.id === 'main' ? '?' : `?tab=${tab.id}`}
      class:is-active={tab.id === active.id}
      aria-current={tab.id === active.id ? 'page' : undefined}
      data-sveltekit-noscroll
      data-sveltekit-replacestate
    >{$t(tab.label)}</a>
  {/each}
</nav>

{#key active.id}
  <active.component />
{/key}

<style>
  .tabs {
    display: flex;
    gap: 2px;
    overflow-x: auto;
    border-bottom: 1px solid var(--ui-border);
    scrollbar-width: none;
  }

  .tabs::-webkit-scrollbar {
    display: none;
  }

  .tabs a {
    flex: none;
    margin-bottom: -1px;
    padding: 9px 14px;
    border-bottom: 2px solid transparent;
    color: var(--ui-muted);
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
    white-space: nowrap;
  }

  .tabs a:hover {
    color: var(--ui-text);
  }

  .tabs a.is-active {
    border-bottom-color: var(--ui-accent);
    color: var(--ui-text);
  }
</style>
