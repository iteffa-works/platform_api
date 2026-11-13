<script lang="ts">
  /** Форма реєстрації: email, пароль, капча */
  import { goto } from '$app/navigation';
  import {
    collectAuthExtensionFields,
    listAuthExtensionSlots,
    loadMe,
    loginWithToken,
    postAuth,
    resolveAuthEndpoint,
    resolveAuthSubmitLabel,
    validateAuthExtensions,
  } from '$lib/domain/auth';
  import { requestCaptchaRefresh } from '$lib/domain/auth/extensions/captcha';
  import { Button } from '$lib/ui/elements';
  import { ErrorText, Field, PasswordField } from '$lib/ui/components';

  let email = $state('');
  let password = $state('');
  let error = $state('');
  let busy = $state(false);

  const mode = 'register' as const;
  const endpoint = $derived(resolveAuthEndpoint(mode, '/auth/register'));
  const submitLabel = $derived(resolveAuthSubmitLabel(mode, 'Зареєструватися'));
  const extensionSlots = $derived(listAuthExtensionSlots(mode));

  async function submit(event: Event) {
    event.preventDefault();
    error = '';
    const invalid = validateAuthExtensions(mode);
    if (invalid) {
      error = invalid;
      return;
    }
    busy = true;
    try {
      const data = await postAuth(endpoint, email, password, collectAuthExtensionFields(mode));
      loginWithToken(data.token);
      await loadMe();
      goto('/app');
    } catch (err) {
      error = err instanceof Error ? err.message : 'Помилка';
      requestCaptchaRefresh();
    } finally {
      busy = false;
    }
  }
</script>

<form class="auth-form" onsubmit={submit}>
  <h1 class="auth-form__title">Реєстрація</h1>

  <Field label="Email" type="email" bind:value={email} autocomplete="email" required />
  <PasswordField label="Пароль" bind:value={password} autocomplete="new-password" required minlength={8} />

  {#each extensionSlots as slot (slot.id)}
    {@const Cmp = slot.component}
    <Cmp {...(slot.props ?? {})} />
  {/each}

  <ErrorText message={error} />

  <Button type="submit" variant="cta" block disabled={busy}>{submitLabel}</Button>
  <a class="auth-form__alt" href="/login">Увійти</a>
</form>

<style>
  .auth-form {
    display: grid;
    gap: var(--ui-gap);
  }

  .auth-form__title {
    margin: 0;
    font-size: 1.15rem;
    font-weight: 650;
    color: var(--ui-text);
  }

  .auth-form__alt {
    justify-self: center;
    color: var(--ui-link);
    font-size: 13px;
    font-weight: 500;
    text-decoration: none;
  }

  .auth-form__alt:hover {
    text-decoration: underline;
  }
</style>
