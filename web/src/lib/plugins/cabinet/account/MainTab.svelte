<script lang="ts">
  /** Основна інформація: картка профілю (аватар, ID, рівень), особисті дані, пароль, видалення акаунта */
  import { askConfirm } from '$lib/ui/dialog/ask';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { displayName, loadMe, logout, user } from '$lib/domain/auth';
  import { roleName, useI18n } from '$lib/i18n';
  import { errorMessage, formatDate } from '$lib/shared/utils';
  import { ErrorText, Panel, PasswordField } from '$lib/ui/components';
  import { Avatar, Badge, Button, Icon, Input, Text } from '$lib/ui/elements';
  import * as cabinetApi from '../api.js';
  import type { Loyalty } from '../api.js';
  import { loadProfile, profile } from '../store.js';

  const { t, tx } = useI18n();

  type FormState = { busy: boolean; error: string; notice: string };
  const formState = (): FormState => ({ busy: false, error: '', notice: '' });

  let loyalty = $state<Loyalty | null>(null);

  let editingName = $state(false);
  let name = $state($user?.name ?? '');
  let profileForm = $state(formState());
  let avatarForm = $state(formState());
  let fileInput: HTMLInputElement;

  let currentPassword = $state('');
  let newPassword = $state('');
  let repeatPassword = $state('');
  let passwordForm = $state(formState());

  let deleteOpen = $state(false);
  let deletePassword = $state('');
  let deleteForm = $state(formState());

  const isDeveloper = $derived(Boolean($user?.permissions['*']));
  const zone = $derived($user?.preferences.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);

  // Рівень лояльності — з білінгу; якщо плагін вимкнено, рядок просто не показується
  onMount(() => {
    cabinetApi.fetchLoyalty().then((data) => (loyalty = data)).catch(() => (loyalty = null));
  });

  async function submit(form: FormState, action: () => Promise<string>) {
    form.busy = true;
    form.error = '';
    form.notice = '';
    try {
      form.notice = await action();
    } catch (err) {
      form.error = errorMessage(err);
    } finally {
      form.busy = false;
    }
  }

  function saveName(event: Event) {
    event.preventDefault();
    void submit(profileForm, async () => {
      await cabinetApi.updateAccount(name);
      await Promise.all([loadMe(), loadProfile()]);
      editingName = false;
      return $t('account.saved');
    });
  }

  function pickAvatar(event: Event) {
    const file = (event.currentTarget as HTMLInputElement).files?.[0];
    if (!file) return;
    void submit(avatarForm, async () => {
      await cabinetApi.uploadAvatar(file);
      await loadMe();
      fileInput.value = '';
      return '';
    });
  }

  function dropAvatar() {
    void submit(avatarForm, async () => {
      await cabinetApi.removeAvatar();
      await loadMe();
      return '';
    });
  }

  function savePassword(event: Event) {
    event.preventDefault();
    void submit(passwordForm, async () => {
      if (newPassword !== repeatPassword) throw new Error($t('account.passwordMismatch'));
      const result = await cabinetApi.changePassword(currentPassword, newPassword);
      currentPassword = '';
      newPassword = '';
      repeatPassword = '';
      return result.revokedSessions
        ? $t('account.passwordChangedSessions', { count: result.revokedSessions })
        : $t('account.passwordChanged');
    });
  }

  async function removeAccount(event: Event) {
    event.preventDefault();
    if (!(await askConfirm($t('account.deleteConfirm'), { tone: 'danger', confirmLabel: $t('common.delete') }))) return;
    void submit(deleteForm, async () => {
      await cabinetApi.deleteAccount(deletePassword);
      await logout();
      await goto('/');
      return '';
    });
  }
</script>

<div class="tab">
  <section class="card">
    <div class="who">
      <div class="who__avatar">
        <Avatar seed={$user?.email ?? ''} src={$user?.avatarUrl} size={88} />
        <input bind:this={fileInput} type="file" accept="image/png,image/jpeg,image/gif,image/webp" hidden onchange={pickAvatar} />
        <div class="who__avatarActions">
          <button type="button" class="link" disabled={avatarForm.busy} onclick={() => fileInput.click()}>
            <Icon name="upload" size={13} />{$t('account.avatarUpload')}
          </button>
          {#if $user?.avatarUrl}
            <button type="button" class="link" disabled={avatarForm.busy} onclick={dropAvatar}>{$t('account.avatarRemove')}</button>
          {/if}
        </div>
      </div>
      <strong class="who__name">{displayName($user)}</strong>
      <span class="who__id">{$t('account.yourId')}: <b>{$user?.id}</b></span>
      {#if loyalty}
        <a class="who__tier" href="?tab=loyalty" data-tier={loyalty.tier}>
          <Icon name="award" size={14} />{$t(`loyalty.tier.${loyalty.tier}`)}
        </a>
      {/if}
      <p class="hint">{$t('account.avatarHint')}</p>
      <ErrorText message={avatarForm.error} />
    </div>

    <dl class="info">
      <div class="info__row">
        <dt>{$t('account.name')}</dt>
        <dd>
          {#if editingName}
            <form class="inline" onsubmit={saveName}>
              <Input bind:value={name} autocomplete="name" />
              <Button type="submit" disabled={profileForm.busy}>{$t('common.save')}</Button>
              <Button variant="ghost" onclick={() => { editingName = false; name = $user?.name ?? ''; }}>{$t('common.cancel')}</Button>
            </form>
          {:else}
            <span class:muted={!$user?.name}>{$user?.name || $t('account.notSet')}</span>
            <button type="button" class="edit" title={$t('account.edit')} aria-label={$t('account.edit')} onclick={() => (editingName = true)}>
              <Icon name="edit" size={14} />
            </button>
          {/if}
        </dd>
      </div>
      <div class="info__row">
        <dt>Email</dt>
        <dd><span>{$user?.email}</span><span class="hint">{$t('account.emailHint')}</span></dd>
      </div>
      <div class="info__row">
        <dt>{$t('prefs.timezone')}</dt>
        <dd>
          <span>{zone}</span>
          <a class="edit" href="/app/preferences" title={$t('account.edit')} aria-label={$t('account.edit')}><Icon name="edit" size={14} /></a>
        </dd>
      </div>
      <div class="info__row">
        <dt>{$t('account.twoFactor')}</dt>
        <dd>
          <Badge tone={$profile?.twoFactor.enabled ? 'green' : 'slate'}>{$profile?.twoFactor.enabled ? $t('security.on') : $t('security.off')}</Badge>
          <a class="edit" href="/app/security" title={$t('account.edit')} aria-label={$t('account.edit')}><Icon name="edit" size={14} /></a>
        </dd>
      </div>
      <div class="info__row">
        <dt>{$t('account.role')}</dt>
        <dd><span>{roleName($tx, $profile?.user.role)}</span></dd>
      </div>
      <div class="info__row">
        <dt>{$t('account.since')}</dt>
        <dd><span>{$profile ? $formatDate($profile.user.createdAt) : '—'}</span></dd>
      </div>
    </dl>
    <div class="card__foot">
      <ErrorText message={profileForm.error} />
      {#if profileForm.notice}<p class="notice">{profileForm.notice}</p>{/if}
    </div>
  </section>

  <Panel title={$t('account.changePassword')}>
    <form class="password" onsubmit={savePassword}>
      <PasswordField label={$t('account.currentPassword')} bind:value={currentPassword} autocomplete="current-password" required />
      <PasswordField label={$t('account.newPassword')} bind:value={newPassword} autocomplete="new-password" required />
      <PasswordField label={$t('account.repeatPassword')} bind:value={repeatPassword} autocomplete="new-password" required />
      <div class="password__foot">
        <p class="hint">{$t('account.passwordHint')}</p>
        <Button type="submit" disabled={passwordForm.busy}>{$t('common.update')}</Button>
      </div>
      <ErrorText message={passwordForm.error} />
      {#if passwordForm.notice}<p class="notice">{passwordForm.notice}</p>{/if}
    </form>
  </Panel>

  <section class="danger">
    <div class="danger__text">
      <strong><Icon name="trash" size={15} />{$t('account.delete')}</strong>
      <Text tone="muted">{isDeveloper ? $t('account.deleteDeveloper') : $t('account.deleteText')}</Text>
    </div>
    {#if !isDeveloper}
      {#if deleteOpen}
        <form class="danger__form" onsubmit={removeAccount}>
          <PasswordField label={$t('account.currentPassword')} bind:value={deletePassword} autocomplete="current-password" required />
          <Button type="submit" variant="danger" disabled={deleteForm.busy}>{$t('common.delete')}</Button>
          <Button variant="ghost" onclick={() => (deleteOpen = false)}>{$t('common.cancel')}</Button>
        </form>
      {:else}
        <Button variant="ghost" onclick={() => (deleteOpen = true)}>{$t('common.delete')}</Button>
      {/if}
    {/if}
    <ErrorText message={deleteForm.error} />
  </section>
</div>

<style>
  .tab {
    display: grid;
    gap: 16px;
    padding-top: 16px;
  }

  .card {
    display: grid;
    grid-template-columns: 260px minmax(0, 1fr);
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius-lg, var(--ui-radius));
    background: var(--ui-surface);
  }

  .who {
    display: grid;
    justify-items: center;
    align-content: start;
    gap: 8px;
    padding: 24px 20px;
    border-right: 1px solid var(--ui-border);
    text-align: center;
  }

  .who__avatar {
    display: grid;
    justify-items: center;
    gap: 8px;
  }

  .who__avatar :global(.ui-avatar) {
    box-shadow: 0 0 0 1px var(--ui-border);
  }

  .who__avatarActions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 4px 12px;
  }

  .who__name {
    margin-top: 4px;
    font-size: 17px;
    overflow-wrap: anywhere;
  }

  .who__id {
    color: var(--ui-muted);
    font-size: 13px;
  }

  .who__id b {
    color: var(--ui-text);
    font-variant-numeric: tabular-nums;
  }

  .who__tier {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 3px 10px;
    border: 1px solid var(--tier, var(--ui-border));
    border-radius: var(--ui-radius-sm, 4px);
    color: var(--tier, var(--ui-text));
    font-size: 12px;
    font-weight: 700;
    text-decoration: none;
  }

  .who__tier[data-tier='bronze'] { --tier: #b5712f; }
  .who__tier[data-tier='silver'] { --tier: #8a96a3; }
  .who__tier[data-tier='gold'] { --tier: #d4a017; }
  .who__tier[data-tier='platinum'] { --tier: #5b8db8; }

  .info {
    margin: 0;
  }

  .info__row {
    display: grid;
    grid-template-columns: 180px minmax(0, 1fr);
    gap: 12px;
    align-items: center;
    min-height: 52px;
    padding: 8px 20px;
    border-bottom: 1px solid var(--ui-border);
  }

  .info__row:last-child {
    border-bottom: 0;
  }

  .info dt {
    color: var(--ui-muted);
    font-size: 13px;
  }

  .info dd {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 12px;
    margin: 0;
    min-width: 0;
    font-size: 14px;
    overflow-wrap: anywhere;
  }

  .info dd .edit {
    margin-left: auto;
  }

  .muted {
    color: var(--ui-muted);
  }

  .edit {
    display: inline-grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border: 0;
    border-radius: var(--ui-radius-sm, 4px);
    background: transparent;
    color: var(--ui-muted);
    cursor: pointer;
  }

  .edit:hover {
    background: var(--ui-surface-2, var(--ui-accent-soft));
    color: var(--ui-accent);
  }

  .inline {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    width: 100%;
  }

  .inline :global(input) {
    flex: 1;
    min-width: 12rem;
  }

  .card__foot {
    grid-column: 1 / -1;
    padding: 0 20px;
  }

  .card__foot:empty {
    display: none;
  }

  .link {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ui-accent);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
  }

  .link:hover {
    text-decoration: underline;
  }

  .password {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }

  .password__foot {
    display: flex;
    flex-wrap: wrap;
    grid-column: 1 / -1;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }

  .password > :global(*:not(.ui-label)) {
    grid-column: 1 / -1;
  }

  .hint {
    margin: 0;
    color: var(--ui-muted);
    font-size: 12px;
  }

  .notice {
    margin: 0;
    color: var(--ui-success);
    font-weight: 600;
  }

  .danger {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 12px 24px;
    padding: 16px 20px;
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius-lg, var(--ui-radius));
    background: var(--ui-surface);
  }

  .danger__text {
    display: grid;
    gap: 4px;
    flex: 1;
    min-width: 16rem;
  }

  .danger__text strong {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .danger__form {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 8px;
  }

  @media (max-width: 860px) {
    .card,
    .password {
      grid-template-columns: 1fr;
    }

    .who {
      border-right: 0;
      border-bottom: 1px solid var(--ui-border);
    }

    .info__row {
      grid-template-columns: 1fr;
      gap: 4px;
    }
  }
</style>
