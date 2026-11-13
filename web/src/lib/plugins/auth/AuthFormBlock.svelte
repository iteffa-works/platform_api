<script lang="ts">
  /** Форма входу / реєстрації: email, пароль + слоти розширень (капча) */
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
    type AuthMode,
  } from '$lib/domain/auth';
  import { requestCaptchaRefresh } from '$lib/domain/auth/extensions/captcha';
  import { errorMessage } from '$lib/shared/utils';
  import { Button } from '$lib/ui/elements';
  import { ErrorText, Field, PasswordField } from '$lib/ui/components';

  let { mode = 'login' }: { mode?: AuthMode } = $props();

  const TEXT = {
    login: {
      title: 'Вхід',
      submit: 'Увійти',
      endpoint: '/auth/login',
      password: 'current-password',
      alt: { href: '/register', label: 'Створити акаунт' },
    },
    register: {
      title: 'Реєстрація',
      submit: 'Зареєструватися',
      endpoint: '/auth/register',
      password: 'new-password',
      alt: { href: '/login', label: 'Увійти' },
    },
  } as const;

  let email = $state('');
  let password = $state('');
  let error = $state('');
  let busy = $state(false);

  const text = $derived(TEXT[mode]);
  const endpoint = $derived(resolveAuthEndpoint(mode, text.endpoint));
  const submitLabel = $derived(resolveAuthSubmitLabel(mode, text.submit));
  const extensionSlots = $derived(listAuthExtensionSlots(mode));

  async function submit(event: Event) {
    event.preventDefault();
    error = validateAuthExtensions(mode) ?? '';
    if (error) return;
    busy = true;
    try {
      const data = await postAuth(endpoint, email, password, collectAuthExtensionFields(mode));
      loginWithToken(data.token);
      await loadMe();
      await goto('/app');
    } catch (err) {
      error = errorMessage(err);
      requestCaptchaRefresh();
    } finally {
      busy = false;
    }
  }
</script>

<form class="auth-form" onsubmit={submit}>
  <h1 class="auth-form__title">{text.title}</h1>

  <Field label="Email" type="email" bind:value={email} autocomplete="email" required />
  <PasswordField label="Пароль" bind:value={password} autocomplete={text.password} required minlength={8} />

  {#each extensionSlots as slot (slot.id)}
    {@const Cmp = slot.component}
    <Cmp {...(slot.props ?? {})} />
  {/each}

  <ErrorText message={error} />

  <Button type="submit" variant="cta" block disabled={busy}>{submitLabel}</Button>
  <a class="auth-form__alt" href={text.alt.href}>{text.alt.label}</a>
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
