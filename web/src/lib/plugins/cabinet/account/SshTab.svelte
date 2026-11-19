<script lang="ts">
  /** SSH-ключі: список (тип, відбиток), додавання з перевіркою формату, видалення */
  import { askConfirm } from '$lib/ui/dialog/ask';
  import { onMount } from 'svelte';
  import { useI18n } from '$lib/i18n';
  import { errorMessage, formatDateTime } from '$lib/shared/utils';
  import { DataTable, EmptyState, ErrorText, Field, Panel } from '$lib/ui/components';
  import { Button, Icon, Text } from '$lib/ui/elements';
  import * as cabinetApi from '../api.js';
  import type { SshKeyItem } from '../api.js';

  const { t } = useI18n();
  const COMMAND = 'ssh-keygen -t ed25519 -C "you@example.com"';

  let keys = $state<SshKeyItem[] | null>(null);
  let adding = $state(false);
  let title = $state('');
  let publicKey = $state('');
  let busy = $state(false);
  let error = $state('');
  let copied = $state(false);

  async function load() {
    try {
      keys = (await cabinetApi.fetchSshKeys()).keys;
    } catch (err) {
      error = errorMessage(err);
    }
  }

  onMount(load);

  async function add(event: Event) {
    event.preventDefault();
    busy = true;
    error = '';
    try {
      await cabinetApi.addSshKey(title.trim(), publicKey);
      title = '';
      publicKey = '';
      adding = false;
      await load();
    } catch (err) {
      error = errorMessage(err);
    } finally {
      busy = false;
    }
  }

  async function remove(key: SshKeyItem) {
    if (!(await askConfirm($t('ssh.removeConfirm', { title: key.title }), { tone: 'danger', confirmLabel: $t('common.delete') }))) return;
    error = '';
    try {
      await cabinetApi.removeSshKey(key.id);
      await load();
    } catch (err) {
      error = errorMessage(err);
    }
  }

  async function copyCommand() {
    await navigator.clipboard.writeText(COMMAND);
    copied = true;
  }
</script>

<div class="tab">
  <section class="howto">
    <Icon name="info" size={20} />
    <div class="howto__body">
      <strong>{$t('ssh.howto')}</strong>
      <Text tone="muted">{$t('ssh.howtoText')}</Text>
      <div class="command">
        <code>{COMMAND}</code>
        <button type="button" onclick={copyCommand} title={$t('common.copy')} aria-label={$t('common.copy')}>
          <Icon name={copied ? 'check' : 'copy'} size={14} />
        </button>
      </div>
    </div>
  </section>

  <Panel title={$t('account.tab.ssh')} flush>
    {#if keys && keys.length}
      <DataTable>
        {#snippet head()}
          <tr><th>{$t('ssh.name')}</th><th>{$t('ssh.type')}</th><th>{$t('ssh.fingerprint')}</th><th>{$t('ssh.added')}</th><th></th></tr>
        {/snippet}
        {#snippet body()}
          {#each keys! as key (key.id)}
            <tr>
              <td><span class="name"><Icon name="terminal" size={14} />{key.title}</span></td>
              <td class="muted">{key.type}</td>
              <td><code class="fp">{key.fingerprint}</code></td>
              <td class="muted">{$formatDateTime(key.createdAt)}</td>
              <td class="end">
                <button type="button" class="remove" title={$t('common.delete')} aria-label={$t('common.delete')} onclick={() => remove(key)}>
                  <Icon name="trash" size={14} />
                </button>
              </td>
            </tr>
          {/each}
        {/snippet}
      </DataTable>
    {:else if keys}
      <div class="empty"><EmptyState text={$t('ssh.empty')} /></div>
    {/if}

    <div class="add">
      {#if adding}
        <form class="add__form" onsubmit={add}>
          <Field label={$t('ssh.name')} bind:value={title} placeholder={$t('ssh.namePlaceholder')} />
          <label class="key">
            <span>{$t('ssh.key')}</span>
            <textarea bind:value={publicKey} rows="4" required spellcheck="false" placeholder="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAA… you@example.com"></textarea>
          </label>
          <div class="add__actions">
            <Button type="submit" disabled={busy}>{$t('ssh.add')}</Button>
            <Button variant="ghost" onclick={() => { adding = false; error = ''; }}>{$t('common.cancel')}</Button>
          </div>
        </form>
      {:else}
        <Button onclick={() => (adding = true)}><Icon name="plus" />{$t('ssh.add')}</Button>
        <Text tone="muted">{$t('ssh.hint')}</Text>
      {/if}
      <ErrorText message={error} />
    </div>
  </Panel>
</div>

<style>
  .tab {
    display: grid;
    gap: 16px;
    padding-top: 16px;
  }

  .howto {
    display: flex;
    gap: 14px;
    padding: 14px 16px;
    border: 1px solid var(--ui-border);
    border-left: 3px solid var(--ui-info, #3b82f6);
    border-radius: var(--ui-radius-lg, var(--ui-radius));
    background: var(--ui-surface);
    color: var(--ui-info, #3b82f6);
  }

  .howto__body {
    display: grid;
    gap: 6px;
    min-width: 0;
    color: var(--ui-text);
  }

  .command {
    display: flex;
    align-items: center;
    justify-self: start;
    max-width: 100%;
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius);
    background: var(--ui-bg, var(--ui-surface));
  }

  .command code {
    padding: 6px 10px;
    overflow-x: auto;
    font-size: 12px;
    white-space: nowrap;
  }

  .command button,
  .remove {
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border: 0;
    background: none;
    color: var(--ui-muted);
    cursor: pointer;
  }

  .command button {
    border-left: 1px solid var(--ui-border);
  }

  .command button:hover {
    color: var(--ui-accent);
  }

  .remove:hover {
    color: var(--ui-danger, #dc2626);
  }

  .name {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
  }

  .fp {
    font-size: 12px;
    word-break: break-all;
  }

  .muted {
    color: var(--ui-muted);
    font-size: 13px;
  }

  .end {
    text-align: right;
  }

  .empty {
    padding: 8px 16px;
  }

  .add {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    border-top: 1px solid var(--ui-border);
  }

  .add__form {
    display: grid;
    gap: 12px;
    width: 100%;
  }

  .key {
    display: grid;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
  }

  .key textarea {
    padding: 8px 10px;
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius);
    background: var(--ui-surface);
    color: var(--ui-text);
    font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
    font-size: 12px;
    font-weight: 400;
    resize: vertical;
  }

  .key textarea:focus {
    border-color: var(--ui-accent);
    outline: none;
  }

  .add__actions {
    display: flex;
    gap: 8px;
  }
</style>
