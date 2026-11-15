<script lang="ts">
  /** Хостинг-акаунти: створення в панелі / привʼязка наявного користувача, блокування, видалення */
  import { onMount } from 'svelte';
  import { can, user } from '$lib/domain/auth';
  import { useI18n } from '$lib/i18n';
  import { errorMessage, formatDateTime } from '$lib/shared/utils';
  import { DataTable, EmptyState, ErrorText, Field, Panel } from '$lib/ui/components';
  import { Badge, Button } from '$lib/ui/elements';
  import * as isp from './api.js';
  import type { IspAccount, IspServer, PanelUser } from './api.js';

  const { t } = useI18n();

  let accounts = $state<IspAccount[]>([]);
  let servers = $state<IspServer[]>([]);
  let presets = $state<string[]>([]);
  let panelUsers = $state<PanelUser[]>([]);
  let error = $state('');
  let notice = $state('');
  let busy = $state(false);

  let mode = $state<'create' | 'link'>('create');
  let serverId = $state<number | null>(null);
  let email = $state('');
  let panelUser = $state('');
  let preset = $state('');
  let password = $state('');

  const canManage = $derived(can($user, 'ispmanager', 'manage'));
  const activeServers = $derived(servers.filter((server) => server.isActive));
  const freePanelUsers = $derived(panelUsers.filter((item) => !item.linked));

  async function load() {
    const [list, srv] = await Promise.all([isp.fetchAccounts(), isp.fetchServers()]);
    accounts = list.accounts;
    servers = srv.servers;
    if (serverId === null && activeServers[0]) await selectServer(activeServers[0].id);
  }

  /** Шаблони й користувачі панелі обраного сервера (помилка панелі не блокує форму) */
  async function selectServer(id: number) {
    serverId = id;
    presets = [];
    panelUsers = [];
    if (!canManage) return;
    try {
      const [p, u] = await Promise.all([isp.fetchPresets(id), isp.fetchPanelUsers(id)]);
      presets = p.presets;
      panelUsers = u.users;
    } catch (err) {
      error = errorMessage(err);
    }
  }

  async function run(action: () => Promise<string | void>) {
    busy = true;
    error = '';
    notice = '';
    try {
      notice = (await action()) ?? '';
      await load();
    } catch (err) {
      error = errorMessage(err);
    } finally {
      busy = false;
    }
  }

  function submit(event: Event) {
    event.preventDefault();
    if (serverId === null) return;
    const id = serverId;
    void run(async () => {
      const result = await isp.createAccount({
        mode,
        serverId: id,
        email,
        panelUser,
        preset: mode === 'create' ? preset : undefined,
        password: mode === 'create' && password ? password : undefined,
      });
      const login = result.account.panelUser;
      email = '';
      panelUser = '';
      password = '';
      await selectServer(id);
      return result.password
        ? $t('ispmanager:generatedPassword', { login, password: result.password })
        : $t('ispmanager:created', { login });
    });
  }

  const setStatus = (account: IspAccount, action: 'suspend' | 'resume') =>
    run(() => isp.setAccountStatus(account.id, action).then(() => undefined));

  const remove = (account: IspAccount) => {
    if (!confirm($t('ispmanager:deleteAccountConfirm', { login: account.panelUser }))) return;
    const fromPanel = confirm($t('ispmanager:deleteFromPanelConfirm', { login: account.panelUser }));
    void run(() => isp.deleteAccount(account.id, fromPanel).then(() => undefined));
  };

  onMount(() => {
    load().catch((err) => (error = errorMessage(err)));
  });
</script>

<ErrorText message={error} />
{#if notice}<p class="notice">{notice}</p>{/if}

{#if canManage && activeServers.length}
  <Panel title={$t('ispmanager:newAccount')}>
    <div class="modes" role="radiogroup">
      <label><input type="radio" bind:group={mode} value="create" /> {$t('ispmanager:mode.create')}</label>
      <label><input type="radio" bind:group={mode} value="link" /> {$t('ispmanager:mode.link')}</label>
    </div>
    <form class="row" onsubmit={submit}>
      <label class="select">
        <span>{$t('ispmanager:server')}</span>
        <select value={serverId} onchange={(event) => selectServer(Number(event.currentTarget.value))}>
          {#each activeServers as server (server.id)}
            <option value={server.id}>{server.name}</option>
          {/each}
        </select>
      </label>
      <Field label={$t('ispmanager:email')} type="email" bind:value={email} required grow />
      {#if mode === 'create'}
        <Field label={$t('ispmanager:panelUser')} bind:value={panelUser} required autocomplete="off" />
        <label class="select">
          <span>{$t('ispmanager:preset')}</span>
          <select bind:value={preset}>
            <option value="">{$t('ispmanager:presetDefault')}</option>
            {#each presets as name (name)}<option value={name}>{name}</option>{/each}
          </select>
        </label>
        <Field label={$t('ispmanager:password')} type="password" bind:value={password} autocomplete="new-password" />
      {:else}
        <label class="select">
          <span>{$t('ispmanager:panelUser')}</span>
          <select bind:value={panelUser} required>
            <option value="" disabled>—</option>
            {#each freePanelUsers as item (item.name)}
              <option value={item.name}>{item.name}{item.fullname ? ` · ${item.fullname}` : ''}</option>
            {/each}
          </select>
        </label>
      {/if}
      <Button type="submit" disabled={busy}>{mode === 'create' ? $t('ispmanager:create') : $t('ispmanager:link')}</Button>
    </form>
  </Panel>
{/if}

<Panel title="{$t('ispmanager:accounts')} · {accounts.length}" flush>
  {#if accounts.length === 0}
    <div class="pad"><EmptyState text={$t('ispmanager:noAccounts')} /></div>
  {:else}
    <DataTable>
      {#snippet head()}
        <tr>
          <th>{$t('ispmanager:panelUser')}</th>
          <th>{$t('ispmanager:user')}</th>
          <th>{$t('ispmanager:server')}</th>
          <th>{$t('ispmanager:status')}</th>
          <th>{$t('common.date')}</th>
          <th></th>
        </tr>
      {/snippet}
      {#snippet body()}
        {#each accounts as account (account.id)}
          <tr>
            <td><strong>{account.panelUser}</strong>{#if account.preset}<br /><small class="muted">{account.preset}</small>{/if}</td>
            <td>{account.user?.email ?? '—'}</td>
            <td>{account.server?.name ?? '—'}</td>
            <td>
              <Badge tone={account.status === 'active' ? 'green' : 'orange'}>
                {account.status === 'active' ? $t('ispmanager:status.active') : $t('ispmanager:status.suspended')}
              </Badge>
            </td>
            <td class="muted">{$formatDateTime(account.createdAt)}</td>
            <td class="actions">
              {#if canManage}
                {#if account.status === 'active'}
                  <Button variant="ghost" disabled={busy} onclick={() => setStatus(account, 'suspend')}>{$t('ispmanager:suspend')}</Button>
                {:else}
                  <Button variant="ghost" disabled={busy} onclick={() => setStatus(account, 'resume')}>{$t('ispmanager:resume')}</Button>
                {/if}
                <Button variant="ghost" disabled={busy} onclick={() => remove(account)}>{$t('ispmanager:delete')}</Button>
              {/if}
            </td>
          </tr>
        {/each}
      {/snippet}
    </DataTable>
  {/if}
</Panel>

<style>
  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 12px;
  }

  .modes {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 12px;
    font-size: 14px;
  }

  .select {
    display: grid;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
  }

  .select select {
    min-height: 40px;
    padding: 0 10px;
    border: 1px solid var(--ui-border);
    border-radius: 10px;
    background: var(--ui-surface, transparent);
    color: inherit;
    font: inherit;
    font-weight: 400;
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
    overflow-wrap: anywhere;
  }

  .pad {
    padding: 16px;
  }
</style>
