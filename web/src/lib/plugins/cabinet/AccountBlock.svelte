<script lang="ts">
  /** Акаунт: аватар, імʼя, зміна пароля, видалення акаунта */
  import { goto } from '$app/navigation';
  import { displayName, loadMe, logout, user } from '$lib/domain/auth';
  import { roleName, useI18n } from '$lib/i18n';
  import { errorMessage } from '$lib/shared/utils';
  import { ErrorText, Field, Panel, PasswordField } from '$lib/ui/components';
  import { Avatar, Button, Icon, Text } from '$lib/ui/elements';
  import * as cabinetApi from './api.js';
  import { loadProfile, profile } from './store.js';

  const { t, tx } = useI18n();

  type FormState = { busy: boolean; error: string; notice: string };
  const formState = (): FormState => ({ busy: false, error: '', notice: '' });

  let name = $state($user?.name ?? '');
  let profileForm = $state(formState());
  let avatarForm = $state(formState());
  let fileInput: HTMLInputElement;

  let currentPassword = $state('');
  let newPassword = $state('');
  let repeatPassword = $state('');
  let passwordForm = $state(formState());

  let deletePassword = $state('');
  let deleteForm = $state(formState());

  const isDeveloper = $derived(Boolean($user?.permissions['*']));

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

  function saveProfile(event: Event) {
    event.preventDefault();
    void submit(profileForm, async () => {
      await cabinetApi.updateAccount(name);
      await Promise.all([loadMe(), loadProfile()]);
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

  function removeAccount(event: Event) {
    event.preventDefault();
    if (!confirm($t('account.deleteConfirm'))) return;
    void submit(deleteForm, async () => {
      await cabinetApi.deleteAccount(deletePassword);
      await logout();
      await goto('/');
      return '';
    });
  }
</script>

<div class="columns">
  <Panel title={$t('account.profile')}>
    <form class="form" onsubmit={saveProfile}>
      <div class="me">
        <Avatar seed={$user?.email ?? ''} src={$user?.avatarUrl} size={64} />
        <div class="me__info">
          <strong>{displayName($user)}</strong>
          <Text tone="muted">{roleName($tx, $profile?.user.role)}</Text>
          <div class="me__actions">
            <input bind:this={fileInput} type="file" accept="image/png,image/jpeg,image/gif,image/webp" hidden onchange={pickAvatar} />
            <Button variant="ghost" disabled={avatarForm.busy} onclick={() => fileInput.click()}>
              <Icon name="upload" />{$t('account.avatarUpload')}
            </Button>
            {#if $user?.avatarUrl}
              <Button variant="ghost" disabled={avatarForm.busy} onclick={dropAvatar}>{$t('account.avatarRemove')}</Button>
            {/if}
          </div>
          <p class="hint">{$t('account.avatarHint')}</p>
          <ErrorText message={avatarForm.error} />
        </div>
      </div>
      <div class="pair">
        <Field label={$t('account.name')} bind:value={name} autocomplete="name" />
        <Field label={$t('auth.email')} value={$user?.email ?? ''} type="email" disabled />
      </div>
      <p class="hint">{$t('account.emailHint')}</p>
      <ErrorText message={profileForm.error} />
      {#if profileForm.notice}<p class="notice">{profileForm.notice}</p>{/if}
      <div class="actions"><Button type="submit" disabled={profileForm.busy}>{$t('common.save')}</Button></div>
    </form>
  </Panel>

  <Panel title={$t('account.changePassword')}>
    <form class="form" onsubmit={savePassword}>
      <PasswordField label={$t('account.currentPassword')} bind:value={currentPassword} autocomplete="current-password" required />
      <PasswordField label={$t('account.newPassword')} bind:value={newPassword} autocomplete="new-password" required />
      <PasswordField label={$t('account.repeatPassword')} bind:value={repeatPassword} autocomplete="new-password" required />
      <p class="hint">{$t('account.passwordHint')}</p>
      <ErrorText message={passwordForm.error} />
      {#if passwordForm.notice}<p class="notice">{passwordForm.notice}</p>{/if}
      <div class="actions"><Button type="submit" disabled={passwordForm.busy}>{$t('common.update')}</Button></div>
    </form>
  </Panel>
</div>

<Panel title={$t('account.delete')}>
  {#if isDeveloper}
    <Text tone="muted">{$t('account.deleteDeveloper')}</Text>
  {:else}
    <Text tone="muted">{$t('account.deleteText')}</Text>
    <form class="danger" onsubmit={removeAccount}>
      <PasswordField label={$t('account.currentPassword')} bind:value={deletePassword} autocomplete="current-password" required />
      <Button type="submit" variant="danger" disabled={deleteForm.busy}>{$t('common.delete')}</Button>
    </form>
    <ErrorText message={deleteForm.error} />
  {/if}
</Panel>

<style>
  .columns {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
    align-items: start;
  }

  .form {
    display: grid;
    gap: 12px;
  }

  .me {
    display: flex;
    align-items: flex-start;
    gap: 16px;
  }

  .me__info {
    display: grid;
    gap: 6px;
  }

  .me__info strong {
    font-size: 1.05rem;
  }

  .me__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .pair {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
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

  .actions {
    display: flex;
    justify-content: flex-end;
  }

  .danger {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 12px;
  }

  .danger :global(.ui-label) {
    flex: 1;
    min-width: 14rem;
  }

  @media (max-width: 860px) {
    .columns,
    .pair {
      grid-template-columns: 1fr;
    }
  }
</style>
