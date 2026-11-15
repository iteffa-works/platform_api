<script lang="ts">
  /** Безпека: двофакторна автентифікація (TOTP) і активні сесії (пристрої) */
  import { onMount } from 'svelte';
  import { loadMe } from '$lib/domain/auth';
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
  let sessionsError = $state('');

  async function loadSessions() {
    try {
      sessions = (await cabinetApi.fetchSessions()).sessions;
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

<Panel
  title={$t('security.sessions')}
  flush
>
  <DataTable>
    {#snippet head()}
      <tr><th>{$t('security.device')}</th><th>IP</th><th>{$t('security.lastSeen')}</th><th></th></tr>
    {/snippet}
    {#snippet body()}
      {#each sessions as session (session.id)}
        <tr>
          <td>
            <span class="device"><Icon name="monitor" />{describeAgent(session.userAgent)}</span>
            {#if session.current}<Badge tone="green">{$t('security.current')}</Badge>{/if}
          </td>
          <td class="muted">{session.ip ?? '—'}</td>
          <td class="muted">{$formatDateTime(session.lastSeenAt)}</td>
          <td class="end">
            {#if !session.current}
              <Button variant="ghost" onclick={() => end(session.id)}>{$t('security.end')}</Button>
            {/if}
          </td>
        </tr>
      {/each}
    {/snippet}
  </DataTable>
  <div class="foot">
    <ErrorText message={sessionsError} />
    {#if sessions.length > 1}
      <Button variant="ghost" onclick={endOthers}>{$t('security.endOthers')}</Button>
    {/if}
  </div>
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

  .foot {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-top: 1px solid var(--ui-border);
  }
</style>
