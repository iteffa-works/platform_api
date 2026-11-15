<script lang="ts">
  /**
   * Вхід / реєстрація: email, пароль + слоти розширень (капча).
   * Вхід з 2FA — другий крок: код застосунку або код відновлення.
   * Реєстрація за посиланням `?ref=<код>` — реферальний код запрошувача.
   */
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import {
    acceptUser,
    collectAuthExtensionFields,
    listAuthExtensionSlots,
    postAuth,
    postTwoFactor,
    resolveAuthEndpoint,
    safeNext,
    validateAuthExtensions,
    type AuthMode,
  } from '$lib/domain/auth';
  import { requestCaptchaRefresh } from '$lib/domain/auth/extensions/captcha';
  import { useI18n } from '$lib/i18n';
  import { errorMessage } from '$lib/shared/utils';
  import { ErrorText, Field, PasswordField } from '$lib/ui/components';
  import { Button, Text } from '$lib/ui/elements';

  let { mode = 'login' }: { mode?: AuthMode } = $props();

  const { t, tx } = useI18n();

  const TEXT = {
    login: {
      title: 'auth.signInTitle',
      submit: 'auth.signIn',
      endpoint: '/auth/login',
      password: 'current-password',
      alt: { href: '/register', label: 'auth.createAccount' },
    },
    register: {
      title: 'auth.registerTitle',
      submit: 'auth.register',
      endpoint: '/auth/register',
      password: 'new-password',
      alt: { href: '/login', label: 'auth.signIn' },
    },
  } as const;

  let email = $state('');
  let password = $state('');
  let error = $state('');
  let busy = $state(false);
  /** Другий крок: тікет із відповіді на пароль */
  let ticket = $state('');
  let code = $state('');

  const text = $derived(TEXT[mode]);
  const endpoint = $derived(resolveAuthEndpoint(mode, text.endpoint));
  const extensionSlots = $derived(listAuthExtensionSlots(mode));
  const referral = $derived($page.url.searchParams.get('ref') ?? '');

  async function finish(action: () => Promise<void>) {
    busy = true;
    error = '';
    try {
      await action();
    } catch (err) {
      error = errorMessage(err);
      requestCaptchaRefresh();
    } finally {
      busy = false;
    }
  }

  function submit(event: Event) {
    event.preventDefault();
    const invalid = validateAuthExtensions(mode);
    if (invalid) {
      error = $tx(invalid);
      return;
    }
    void finish(async () => {
      const extra = { ...collectAuthExtensionFields(mode), ...(mode === 'register' && referral ? { ref: referral } : {}) };
      const result = await postAuth(endpoint, email, password, extra);
      if ('twoFactor' in result) {
        ticket = result.ticket;
        return;
      }
      acceptUser(result.user);
      await goto(safeNext($page.url.searchParams.get('next')));
    });
  }

  function submitCode(event: Event) {
    event.preventDefault();
    void finish(async () => {
      const result = await postTwoFactor(ticket, code);
      acceptUser(result.user);
      await goto(safeNext($page.url.searchParams.get('next')));
    });
  }
</script>

{#if ticket}
  <form class="auth-form" onsubmit={submitCode}>
    <h1 class="auth-form__title">{$t('auth.twoFactorTitle')}</h1>
    <Text tone="muted">{$t('auth.twoFactorHint')}</Text>
    <Field label={$t('auth.twoFactorCode')} bind:value={code} autocomplete="one-time-code" inputmode="text" required />
    <ErrorText message={error} />
    <Button type="submit" variant="cta" block disabled={busy}>{$t('auth.confirm')}</Button>
    <button class="auth-form__alt auth-form__link" type="button" onclick={() => { ticket = ''; code = ''; error = ''; }}>
      {$t('auth.back')}
    </button>
  </form>
{:else}
  <form class="auth-form" onsubmit={submit}>
    <h1 class="auth-form__title">{$t(text.title)}</h1>
    {#if mode === 'register' && referral}
      <Text tone="muted">{$t('auth.invited')}</Text>
    {/if}

    <Field label={$t('auth.email')} type="email" bind:value={email} autocomplete="email" required />
    <PasswordField label={$t('auth.password')} bind:value={password} autocomplete={text.password} required minlength={8} />

    {#each extensionSlots as slot (slot.id)}
      {@const Cmp = slot.component}
      <Cmp {...(slot.props ?? {})} />
    {/each}

    <ErrorText message={error} />

    <Button type="submit" variant="cta" block disabled={busy}>{$t(text.submit)}</Button>
    <a class="auth-form__alt" href={text.alt.href}>{$t(text.alt.label)}</a>
  </form>
{/if}

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

  .auth-form__link {
    padding: 0;
    border: 0;
    background: none;
    font: inherit;
    font-size: 13px;
    cursor: pointer;
  }
</style>
