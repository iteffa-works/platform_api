<script lang="ts">
  /** Кабінет: мої хостинг-акаунти, вхід у панель без пароля, сайти, зміна пароля панелі */
  import { onMount } from 'svelte';
  import { useI18n } from '$lib/i18n';
  import { errorMessage } from '$lib/shared/utils';
  import { EmptyState, ErrorText, Field, Panel } from '$lib/ui/components';
  import { Badge, Button, Text } from '$lib/ui/elements';
  import * as isp from './api.js';
  import type { IspAccount, Site } from './api.js';

  const { t } = useI18n();

  let accounts = $state<IspAccount[]>([]);
  let loaded = $state(false);
  let error = $state('');
  let notice = $state('');
  let busy = $state<number | null>(null);
  let sites = $state<Record<number, Site[]>>({});
  let passwords = $state<Record<number, string>>({});

  async function run(id: number, action: () => Promise<void>) {
    busy = id;
    error = '';
    notice = '';
    try {
      await action();
    } catch (err) {
      error = errorMessage(err);
    } finally {
      busy = null;
    }
  }

  /** Вікно відкривається одразу (до await) — інакше браузер заблокує спливаюче вікно */
  const open = (account: IspAccount) => run(account.id, async () => {
    const tab = window.open('about:blank', '_blank');
    try {
      const { url } = await isp.panelLogin(account.id);
      if (tab) tab.location.href = url;
      else window.location.href = url;
    } catch (err) {
      tab?.close();
      throw err;
    }
  });

  const showSites = (account: IspAccount) => run(account.id, async () => {
    sites = { ...sites, [account.id]: (await isp.fetchSites(account.id)).sites };
  });

  function changePassword(event: Event, account: IspAccount) {
    event.preventDefault();
    void run(account.id, async () => {
      await isp.changePanelPassword(account.id, passwords[account.id] ?? '');
      passwords = { ...passwords, [account.id]: '' };
      notice = $t('ispmanager:passwordChanged');
    });
  }

  onMount(() => {
    isp.fetchMyHosting()
      .then((data) => {
        passwords = Object.fromEntries(data.accounts.map((account) => [account.id, '']));
        accounts = data.accounts;
      })
      .catch((err) => (error = errorMessage(err)))
      .finally(() => (loaded = true));
  });
</script>

<ErrorText message={error} />
{#if notice}<p class="notice">{notice}</p>{/if}

{#if loaded && accounts.length === 0}
  <Panel title={$t('ispmanager:cabinet.title')}>
    <EmptyState text={$t('ispmanager:empty')} />
  </Panel>
{/if}

{#each accounts as account (account.id)}
  <Panel title="{account.panelUser} · {account.server?.name ?? ''}">
    <div class="head">
      <div class="meta">
        <Badge tone={account.status === 'active' ? 'green' : 'orange'}>
          {account.status === 'active' ? $t('ispmanager:status.active') : $t('ispmanager:status.suspended')}
        </Badge>
        {#if account.preset}<Text tone="muted">{$t('ispmanager:preset')}: {account.preset}</Text>{/if}
      </div>
      {#if account.status === 'active'}
        <div class="buttons">
          <Button disabled={busy === account.id} onclick={() => open(account)}>{$t('ispmanager:openPanel')}</Button>
          <Button variant="ghost" disabled={busy === account.id} onclick={() => showSites(account)}>{$t('ispmanager:showSites')}</Button>
        </div>
      {/if}
    </div>

    {#if account.status !== 'active'}
      <Text tone="muted">{$t('ispmanager:blocked')}</Text>
    {:else}
      {#if sites[account.id]}
        <h3>{$t('ispmanager:sites')}</h3>
        {#if sites[account.id]!.length === 0}
          <Text tone="muted">{$t('ispmanager:noSites')}</Text>
        {:else}
          <ul class="sites">
            {#each sites[account.id]! as site (site.name)}
              <li>
                <strong>{site.name}</strong>
                {#if site.ssl}<Badge tone="green">SSL</Badge>{/if}
                {#if !site.active}<Badge tone="slate">{$t('ispmanager:inactive')}</Badge>{/if}
                {#if site.docroot}<small class="muted">{site.docroot}</small>{/if}
              </li>
            {/each}
          </ul>
        {/if}
      {/if}

      <form class="row" onsubmit={(event) => changePassword(event, account)}>
        <Field
          label={$t('ispmanager:changePassword')}
          type="password"
          bind:value={passwords[account.id]}
          minlength={8}
          required
          autocomplete="new-password"
          grow
        />
        <Button type="submit" variant="ghost" disabled={busy === account.id}>{$t('common.save')}</Button>
      </form>
    {/if}
  </Panel>
{/each}

<style>
  .head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
  }

  .meta,
  .buttons {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }

  h3 {
    margin: 12px 0 8px;
    font-size: 14px;
  }

  .sites {
    display: grid;
    gap: 6px;
    margin: 0 0 12px;
    padding: 0;
    list-style: none;
  }

  .sites li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }

  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 12px;
    margin-top: 12px;
  }

  .muted {
    color: var(--ui-muted);
  }

  .notice {
    margin: 0;
    color: var(--ui-success);
    font-weight: 600;
  }
</style>
