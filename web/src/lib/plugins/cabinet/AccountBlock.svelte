<script lang="ts">
  /** Акаунт: профіль (імʼя), зміна пароля, видалення акаунта */
  import { goto } from '$app/navigation';
  import { displayName, loadMe, logout, user } from '$lib/domain/auth';
  import { errorMessage } from '$lib/shared/utils';
  import { ErrorText, Field, Panel, PasswordField } from '$lib/ui/components';
  import { Avatar, Button, Text } from '$lib/ui/elements';
  import * as cabinetApi from './api.js';
  import { loadProfile, profile } from './store.js';

  /** Стан окремої форми: busy / помилка / підтвердження */
  function formState() {
    return { busy: false, error: '', notice: '' };
  }

  let name = $state($user?.name ?? '');
  let profileForm = $state(formState());

  let currentPassword = $state('');
  let newPassword = $state('');
  let repeatPassword = $state('');
  let passwordForm = $state(formState());

  let deletePassword = $state('');
  let deleteForm = $state(formState());

  const isDeveloper = $derived(Boolean($user?.permissions['*']));

  async function submit(form: { busy: boolean; error: string; notice: string }, action: () => Promise<string>) {
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
      return 'Профіль збережено';
    });
  }

  function savePassword(event: Event) {
    event.preventDefault();
    void submit(passwordForm, async () => {
      if (newPassword !== repeatPassword) throw new Error('Нові паролі не збігаються');
      await cabinetApi.changePassword(currentPassword, newPassword);
      currentPassword = '';
      newPassword = '';
      repeatPassword = '';
      return 'Пароль змінено';
    });
  }

  function removeAccount(event: Event) {
    event.preventDefault();
    if (!confirm('Видалити акаунт назавжди? Дію не можна скасувати.')) return;
    void submit(deleteForm, async () => {
      await cabinetApi.deleteAccount(deletePassword);
      logout();
      await goto('/');
      return '';
    });
  }
</script>

<div class="columns">
  <Panel title="Профіль">
    <form class="form" onsubmit={saveProfile}>
      <div class="me">
        <Avatar seed={$user?.email ?? ''} size={56} />
        <div>
          <strong>{displayName($user)}</strong>
          <Text tone="muted">{$profile?.user.role.name}</Text>
        </div>
      </div>
      <div class="pair">
        <Field label="Імʼя" bind:value={name} autocomplete="name" />
        <Field label="Email" value={$user?.email ?? ''} type="email" disabled />
      </div>
      <p class="hint">Зміна email зʼявиться разом із підтвердженням пошти.</p>
      <ErrorText message={profileForm.error} />
      {#if profileForm.notice}<p class="notice">{profileForm.notice}</p>{/if}
      <div class="actions"><Button type="submit" disabled={profileForm.busy}>Зберегти</Button></div>
    </form>
  </Panel>

  <Panel title="Зміна пароля">
    <form class="form" onsubmit={savePassword}>
      <PasswordField label="Поточний пароль" bind:value={currentPassword} autocomplete="current-password" required />
      <PasswordField label="Новий пароль" bind:value={newPassword} autocomplete="new-password" required />
      <PasswordField label="Повторіть новий пароль" bind:value={repeatPassword} autocomplete="new-password" required />
      <ErrorText message={passwordForm.error} />
      {#if passwordForm.notice}<p class="notice">{passwordForm.notice}</p>{/if}
      <div class="actions"><Button type="submit" disabled={passwordForm.busy}>Оновити</Button></div>
    </form>
  </Panel>
</div>

<Panel title="Видалення акаунта">
  {#if isDeveloper}
    <Text tone="muted">Акаунт розробника не видаляється. Спершу передайте роль розробника іншому користувачу.</Text>
  {:else}
    <Text tone="muted">Після видалення акаунта всі ваші дані буде стерто. Дію не можна скасувати.</Text>
    <form class="danger" onsubmit={removeAccount}>
      <PasswordField label="Поточний пароль" bind:value={deletePassword} autocomplete="current-password" required />
      <Button type="submit" variant="danger" disabled={deleteForm.busy}>Видалити</Button>
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
    align-items: center;
    gap: 14px;
  }

  .me strong {
    font-size: 1.05rem;
  }

  .pair {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .hint {
    margin: -4px 0 0;
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
