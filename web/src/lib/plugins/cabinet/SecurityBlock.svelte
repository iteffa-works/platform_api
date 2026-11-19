<script lang="ts">
  /** Безпека: 2FA (TOTP), антифішинговий код, активні сесії та історія входів */
  import { onMount } from 'svelte';
  import { loadMe, user } from '$lib/domain/auth';
  import { useI18n } from '$lib/i18n';
  import { describeAgent, errorMessage, formatDateTime } from '$lib/shared/utils';
  import { DataTable, ErrorText, Field, Panel, PasswordField } from '$lib/ui/components';
  import { Badge, Button, Icon, Text } from '$lib/ui/elements';
  import * as cabinetApi from './api.js';
  import type { SessionItem } from './api.js';
  import { loadProfile, profile } from './store.js';

  const { t } = useI18n();

  /* ---------- 2FA ---------- */
  let setup = $state<{ secret: string; qr: string } | null>(null);
  let code = $state('');
  let recoveryCodes = $state<string[]>([]);
  let disablePassword = $state('');
  let disableCode = $state('');
  let twoFaBusy = $state(false);
  let twoFaError = $state('');
  let copied = $state(false);

  const enabled = $derived(Boolean($profile?.twoFactor.enabled));

  async function run(action: () => Promise<void>) {
    twoFaBusy = true;
    twoFaError = '';
    try {
      await action();
    } catch (err) {
      twoFaError = errorMessage(err);
    } finally {
      twoFaBusy = false;
    }
  }

  const startSetup = () => run(async () => {
    const data = await cabinetApi.twoFactorSetup();
    setup = { secret: data.secret, qr: data.qr };
    code = '';
  });

  const confirmSetup = (event: Event) => {
    event.preventDefault();
    void run(async () => {
      const result = await cabinetApi.twoFactorEnable(setup!.secret, code);
      recoveryCodes = result.recoveryCodes;
      setup = null;
      await Promise.all([loadProfile(), loadMe()]);
    });
  };

  const disable = (event: Event) => {
    event.preventDefault();
    void run(async () => {
      await cabinetApi.twoFactorDisable(disablePassword, disableCode);
      disablePassword = '';
      disableCode = '';
      recoveryCodes = [];
      await Promise.all([loadProfile(), loadMe()]);
    });
  };

  async function copyCodes() {
    await navigator.clipboard.writeText(recoveryCodes.join('\n'));
    copied = true;
  }

  /* ---------- Сесії ---------- */
  let sessions = $state<SessionItem[]>([]);
  let history = $state<SessionItem[]>([]);
  let sessionsError = $state('');

  async function loadSessions() {
    try {
      const data = await cabinetApi.fetchSessions();
      sessions = data.sessions;
      history = data.history;
    } catch (err) {
      sessionsError = errorMessage(err);
    }
  }

  async function end(id: number) {
    await cabinetApi.endSession(id).catch((err) => (sessionsError = errorMessage(err)));
    await loadSessions();
  }

  async function endOthers() {
    if (!confirm($t('security.endOthersConfirm'))) return;
    await cabinetApi.endOtherSessions().catch((err) => (sessionsError = errorMessage(err)));
    await loadSessions();
  }

  onMount(loadSessions);

  /* ---------- Антифішинговий код ---------- */
  let antiOpen = $state(false);
  let antiCode = $state($user?.preferences.antiPhishingCode ?? '');
  let antiBusy = $state(false);
  let antiError = $state('');
  const antiSet = $derived(Boolean($user?.preferences.antiPhishingCode));

  async function saveAnti(event: Event) {
    event.preventDefault();
    antiBusy = true;
    antiError = '';
    try {
      await cabinetApi.updatePreferences({ antiPhishingCode: antiCode.trim() || null });
      await loadMe();
      antiOpen = false;
    } catch (err) {
      antiError = errorMessage(err);
    } finally {
      antiBusy = false;
    }
  }
</script>

<Panel title={$t('security.twoFactor')}>
  {#if recoveryCodes.length}
    <div class="recovery">
      <p class="notice">{$t('security.enabledNow')}</p>
      <Text tone="muted">{$t('security.recoveryHint')}</Text>
      <ol class="recovery__codes">
        {#each recoveryCodes as item (item)}<li><code>{item}</code></li>{/each}
      </ol>
      <div><Button variant="ghost" onclick={copyCodes}><Icon name="copy" />{copied ? $t('common.copied') : $t('common.copy')}</Button></div>
    </div>
  {:else if enabled}
    <div class="status">
      <Badge tone="green">{$t('security.on')}</Badge>
      <Text tone="muted">{$t('security.recoveryLeft', { count: $profile?.twoFactor.recoveryLeft ?? 0 })}</Text>
    </div>
    <form class="row" onsubmit={disable}>
      <PasswordField label={$t('account.currentPassword')} bind:value={disablePassword} autocomplete="current-password" required />
      <Field label={$t('security.code')} bind:value={disableCode} autocomplete="one-time-code" required />
      <Button type="submit" variant="danger" disabled={twoFaBusy}>{$t('security.disable')}</Button>
    </form>
  {:else if setup}
    <div class="setup">
      <img class="setup__qr" src={setup.qr} alt={$t('security.qrAlt')} width="180" height="180" />
      <form class="setup__form" onsubmit={confirmSetup}>
        <Text tone="muted">{$t('security.scanHint')}</Text>
        <p class="hint">{$t('security.manualKey')}: <code class="secret">{setup.secret}</code></p>
        <Field label={$t('security.code')} bind:value={code} autocomplete="one-time-code" inputmode="numeric" required />
        <div class="row">
          <Button type="submit" disabled={twoFaBusy}>{$t('security.confirmEnable')}</Button>
          <Button variant="ghost" onclick={() => (setup = null)}>{$t('common.cancel')}</Button>
        </div>
      </form>
    </div>
  {:else}
    <div class="status">
      <Badge tone="slate">{$t('security.off')}</Badge>
      <Text tone="muted">{$t('security.offHint')}</Text>
    </div>
    <div><Button disabled={twoFaBusy} onclick={startSetup}>{$t('security.enable')}</Button></div>
  {/if}
  <ErrorText message={twoFaError} />
</Panel>

<Panel title={$t('prefs.antiPhishing')}>
  <div class="status">
    <Badge tone={antiSet ? 'green' : 'orange'}>{antiSet ? $t('security.antiPhishingOn') : $t('security.antiPhishingOff')}</Badge>
    <Text tone="muted">{$t('prefs.antiPhishingHint')}</Text>
  </div>
  {#if antiOpen}
    <form class="row" onsubmit={saveAnti}>
      <Field label={$t('prefs.antiPhishingCode')} bind:value={antiCode} />
      <Button type="submit" disabled={antiBusy}>{$t('common.save')}</Button>
      <Button variant="ghost" onclick={() => (antiOpen = false)}>{$t('common.cancel')}</Button>
    </form>
  {:else}
    <div><Button variant={antiSet ? 'ghost' : 'primary'} onclick={() => (antiOpen = true)}>{$t('security.configure')}</Button></div>
  {/if}
  <ErrorText message={antiError} />
</Panel>

<p class="info"><Icon name="help" size={18} />{$t('security.sessionsInfo')}</p>

{#snippet sessionRows(list: SessionItem[], active: boolean)}
  {#each list as session (session.id)}
    <tr class:is-current={session.current} class:is-weak={!session.twoFactor && Boolean($profile?.twoFactor.enabled)}>
      <td class="mono">{session.ip ?? '—'}</td>
      <td class="mono">{session.lastIp ?? '—'}</td>
      <td>
        {#if session.twoFactor}<Badge tone="green">{$t('security.with2fa')}</Badge>{:else}<Badge tone="slate">{$t('security.without2fa')}</Badge>{/if}
      </td>
      <td class="muted">{$formatDateTime(session.createdAt)}</td>
      <td class="muted">{#if session.current}<b class="cur">{$t('security.currentSession')}</b>{:else}{$formatDateTime(session.lastSeenAt)}{/if}</td>
      <td class="muted">{$formatDateTime(active ? session.expiresAt : (session.endedAt ?? session.expiresAt))}</td>
      <td><span class="device"><Icon name="monitor" />{describeAgent(session.userAgent)}</span></td>
      {#if active}
        <td class="end">
          {#if !session.current}
            <button type="button" class="kill" title={$t('security.end')} aria-label={$t('security.end')} onclick={() => end(session.id)}><Icon name="close" size={14} /></button>
          {/if}
        </td>
      {/if}
    </tr>
  {/each}
{/snippet}

<Panel title={$t('security.sessions')} flush>
  {#if sessions.length > 1}
    <div class="bar"><Button variant="danger" onclick={endOthers}>{$t('security.endOthers')}</Button></div>
  {/if}
  <div class="scroll">
    <DataTable>
      {#snippet head()}
        <tr><th>{$t('security.loginIp')}</th><th>{$t('security.lastIp')}</th><th>{$t('security.check')}</th><th>{$t('security.loginAt')}</th><th>{$t('security.lastSeen')}</th><th>{$t('security.validUntil')}</th><th>{$t('security.device')}</th><th></th></tr>
      {/snippet}
      {#snippet body()}{@render sessionRows(sessions, true)}{/snippet}
    </DataTable>
  </div>
  <div class="foot"><ErrorText message={sessionsError} /></div>
</Panel>

<Panel title={$t('security.history')} flush>
  {#if history.length}
    <div class="scroll">
      <DataTable>
        {#snippet head()}
          <tr><th>{$t('security.loginIp')}</th><th>{$t('security.lastIp')}</th><th>{$t('security.check')}</th><th>{$t('security.loginAt')}</th><th>{$t('security.lastSeen')}</th><th>{$t('security.ended')}</th><th>{$t('security.device')}</th></tr>
        {/snippet}
        {#snippet body()}{@render sessionRows(history, false)}{/snippet}
      </DataTable>
    </div>
  {:else}
    <p class="empty">{$t('security.historyEmpty')}</p>
  {/if}
</Panel>

<style>
  .status,
  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
  }

  .row {
    align-items: flex-end;
  }

  .row :global(.ui-label) {
    flex: 1;
    min-width: 12rem;
  }

  .setup {
    display: flex;
    flex-wrap: wrap;
    gap: 24px;
    align-items: flex-start;
  }

  .setup__qr {
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius);
    background: #fff;
  }

  .setup__form {
    display: grid;
    flex: 1;
    gap: 12px;
    min-width: 16rem;
  }

  .secret {
    word-break: break-all;
    font-weight: 600;
  }

  .hint,
  .muted {
    margin: 0;
    color: var(--ui-muted);
    font-size: 13px;
  }

  .notice {
    margin: 0;
    color: var(--ui-success);
    font-weight: 600;
  }

  .recovery {
    display: grid;
    gap: 10px;
  }

  .recovery__codes {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 6px 16px;
    margin: 0;
    padding: 12px 12px 12px 32px;
    border: 1px dashed var(--ui-border-strong);
    border-radius: var(--ui-radius);
    font-size: 14px;
  }

  .device {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-right: 8px;
  }

  .end {
    text-align: right;
  }

  .foot:has(:global(*)) {
    padding: 12px 16px;
    border-top: 1px solid var(--ui-border);
  }

  .bar {
    padding: 12px 16px;
    border-bottom: 1px solid var(--ui-border);
  }

  .scroll {
    overflow-x: auto;
  }

  .mono {
    font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
    font-size: 12px;
    white-space: nowrap;
  }

  td.muted {
    white-space: nowrap;
  }

  tr.is-current td {
    background: color-mix(in srgb, var(--ui-success) 7%, transparent);
  }

  tr.is-weak td {
    background: color-mix(in srgb, #eab308 9%, transparent);
  }

  .cur {
    color: var(--ui-text);
  }

  .kill {
    display: inline-grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius-sm, 4px);
    background: none;
    color: var(--ui-danger, #dc2626);
    cursor: pointer;
  }

  .kill:hover {
    border-color: var(--ui-danger, #dc2626);
  }

  .info {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 0;
    padding: 12px 16px;
    border: 1px solid var(--ui-border);
    border-left: 3px solid var(--ui-info, #3b82f6);
    border-radius: var(--ui-radius-lg, var(--ui-radius));
    background: var(--ui-surface);
    color: var(--ui-muted);
    font-size: 13px;
  }

  .info :global(.ui-icon) {
    flex: none;
    color: var(--ui-info, #3b82f6);
  }

  .empty {
    margin: 0;
    padding: 14px 16px;
    color: var(--ui-muted);
    font-size: 13px;
  }
</style>
