<script lang="ts">
  /** Сервери ISPmanager: додати, перевірити зʼєднання, вимкнути, видалити */
  import { onMount } from 'svelte';
  import { can, user } from '$lib/domain/auth';
  import { useI18n } from '$lib/i18n';
  import { errorMessage } from '$lib/shared/utils';
  import { DataTable, EmptyState, ErrorText, Field, Panel } from '$lib/ui/components';
  import { Badge, Button, Text } from '$lib/ui/elements';
  import * as isp from './api.js';
  import type { IspServer } from './api.js';

  const { t } = useI18n();

  let servers = $state<IspServer[]>([]);
  let error = $state('');
  let notice = $state('');
  let noticeOk = $state(true);
  let busy = $state(false);

  let name = $state('');
  let url = $state('');
  let username = $state('root');
  let password = $state('');
  let defaultPreset = $state('');
  let verifyTls = $state(true);

  const canManage = $derived(can($user, 'ispmanager', 'manage'));

  async function load() {
    servers = (await isp.fetchServers()).servers;
  }

  async function run(action: () => Promise<void>) {
    busy = true;
    error = '';
    notice = '';
    try {
      await action();
      await load();
    } catch (err) {
      error = errorMessage(err);
    } finally {
      busy = false;
    }
  }

  function add(event: Event) {
    event.preventDefault();
    void run(async () => {
      await isp.createServer({ name, url, username, password, verifyTls, defaultPreset });
      name = '';
      url = '';
      password = '';
      defaultPreset = '';
    });
  }

  const check = (server: IspServer) => run(async () => {
    const result = await isp.checkServer(server.id);
    noticeOk = result.ok;
    notice = result.ok
      ? $t('ispmanager:checkOk', { server: server.name, users: result.users, presets: result.presets })
      : $t('ispmanager:checkFail', { server: server.name, error: result.error });
  });

  const toggle = (server: IspServer) => run(async () => {
    await isp.updateServer(server.id, { isActive: !server.isActive });
  });

  const remove = (server: IspServer) => {
    if (!confirm($t('ispmanager:deleteServerConfirm', { server: server.name }))) return;
    void run(() => isp.deleteServer(server.id).then(() => undefined));
  };

  onMount(() => {
    load().catch((err) => (error = errorMessage(err)));
  });
</script>

<ErrorText message={error} />
{#if notice}<p class="notice" class:is-fail={!noticeOk}>{notice}</p>{/if}

<Panel title="{$t('ispmanager:servers')} · {servers.length}" flush>
  {#if servers.length === 0}
    <div class="pad"><EmptyState text={$t('ispmanager:noServers')} /></div>
  {:else}
    <DataTable>
      {#snippet head()}
        <tr>
          <th>{$t('ispmanager:server')}</th>
          <th>{$t('ispmanager:adminLogin')}</th>
          <th>{$t('ispmanager:accountsCount')}</th>
          <th>{$t('ispmanager:status')}</th>
          <th></th>
        </tr>
      {/snippet}
      {#snippet body()}
        {#each servers as server (server.id)}
          <tr>
            <td>
              <strong>{server.name}</strong><br />
              <small class="muted">{server.url}{server.verifyTls ? '' : ' · TLS ✕'}</small>
            </td>
            <td>{server.username}{#if server.defaultPreset}<br /><small class="muted">{server.defaultPreset}</small>{/if}</td>
            <td>{server.accounts}</td>
            <td>
              <Badge tone={server.isActive ? 'green' : 'slate'}>
                {server.isActive ? $t('ispmanager:active') : $t('ispmanager:inactive')}
              </Badge>
            </td>
            <td class="actions">
              {#if canManage}
                <Button variant="ghost" disabled={busy} onclick={() => check(server)}>{$t('ispmanager:check')}</Button>
                <Button variant="ghost" disabled={busy} onclick={() => toggle(server)}>
                  {server.isActive ? $t('ispmanager:disable') : $t('ispmanager:enable')}
                </Button>
                {#if server.accounts === 0}
                  <Button variant="ghost" disabled={busy} onclick={() => remove(server)}>{$t('ispmanager:delete')}</Button>
                {/if}
              {/if}
            </td>
          </tr>
        {/each}
      {/snippet}
    </DataTable>
  {/if}
</Panel>

{#if canManage}
  <Panel title={$t('ispmanager:addServer')}>
    <form class="row" onsubmit={add}>
      <Field label={$t('ispmanager:serverName')} bind:value={name} required />
      <Field label={$t('ispmanager:url')} type="url" bind:value={url} required grow />
      <Field label={$t('ispmanager:adminLogin')} bind:value={username} required autocomplete="off" />
      <Field label={$t('ispmanager:adminPassword')} type="password" bind:value={password} required autocomplete="new-password" />
      <Field label={$t('ispmanager:defaultPreset')} bind:value={defaultPreset} />
      <label class="check"><input type="checkbox" bind:checked={verifyTls} /> {$t('ispmanager:verifyTls')}</label>
      <Button type="submit" disabled={busy}>{$t('common.create')}</Button>
    </form>
    <Text tone="muted">{$t('ispmanager:urlHint')}</Text>
  </Panel>
{/if}

<style>
  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 12px;
  }

  .check {
    display: flex;
    align-items: center;
    gap: 6px;
    min-height: 40px;
    font-size: 14px;
  }

  .actions {
    text-align: right;
    white-space: nowrap;
  }

  .muted {
    color: var(--ui-muted);
  }

  .notice {
    margin: 0;
    color: var(--ui-success);
    font-weight: 600;
  }

  .notice.is-fail {
    color: var(--ui-danger, #d33);
  }

  .pad {
    padding: 16px;
  }
</style>
