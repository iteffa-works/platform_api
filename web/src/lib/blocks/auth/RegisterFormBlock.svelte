<script lang="ts">
  /** Реєстрація FlowAxy — full-width dark form як у референсі */
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
  import { Label } from '$lib/ui/elements';
  import { ErrorText, PasswordField } from '$lib/ui/components';

  let email = $state('');
  let password = $state('');
  let error = $state('');
  let busy = $state(false);

  const mode = 'register' as const;
  const endpoint = $derived(resolveAuthEndpoint(mode, '/auth/register'));
  const submitLabel = $derived(resolveAuthSubmitLabel(mode, 'Кнопка реєстрації'));
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

<form class="reg" onsubmit={submit}>
  <a class="reg__back" href="/login">← Посилання на вхід</a>

  <header class="reg__head">
    <h1 class="reg__title">Заголовок реєстрації</h1>
    <p class="reg__lead">
      Підзаголовок: коротке пояснення до форми реєстрації та наступних кроків підтвердження.
    </p>
  </header>

  {#each extensionSlots.filter((s) => s.id === 'verification') as slot (slot.id)}
    {@const Cmp = slot.component}
    <div class="reg__slot"><Cmp {...(slot.props ?? {})} /></div>
  {/each}

  <div class="reg__field">
    <Label>
      Email
      <input class="reg__input" type="email" bind:value={email} autocomplete="email" required placeholder="your@email.com" />
    </Label>
    <p class="reg__hint">Підказка до поля email</p>
  </div>

  <div class="reg__field">
    <PasswordField label="Пароль" bind:value={password} autocomplete="new-password" required minlength={8} />
    <p class="reg__hint">Підказка до поля пароля</p>
  </div>

  {#each extensionSlots.filter((s) => s.id !== 'verification') as slot (slot.id)}
    {@const Cmp = slot.component}
    <div class="reg__slot"><Cmp {...(slot.props ?? {})} /></div>
  {/each}

  <ErrorText message={error} />

  <button class="reg__submit" type="submit" disabled={busy}>
    {submitLabel}
    <span aria-hidden="true">→</span>
  </button>
</form>

<style>
  .reg {
    display: grid;
    gap: 16px;
    color: #d7dce5;
  }

  .reg__back {
    color: #8fa3c7;
    text-decoration: none;
    font-size: 13px;
    font-weight: 500;
    width: fit-content;
  }
  .reg__back:hover { text-decoration: underline; }

  .reg__head { display: grid; gap: 8px; }
  .reg__title {
    margin: 0;
    font-size: clamp(1.3rem, 2vw, 1.55rem);
    font-weight: 650;
    letter-spacing: -0.02em;
    color: #f1f3f7;
    line-height: 1.25;
  }
  .reg__lead {
    margin: 0;
    max-width: 62ch;
    font-size: 13px;
    color: #8a93a3;
    line-height: 1.5;
  }

  .reg__field { display: grid; gap: 6px; }
  .reg__hint { margin: 0; font-size: 12px; color: #6b7382; }

  .reg :global(.ui-label) {
    gap: 6px;
    font-size: 12px;
    font-weight: 600;
    color: #9aa3b2;
  }

  .reg__input,
  .reg :global(.ui-password__input) {
    width: 100%;
    height: 44px;
    padding: 0 12px;
    border: 1px solid #2a3140 !important;
    border-radius: 6px !important;
    background: #121722 !important;
    color: #f1f3f7 !important;
    font: inherit !important;
    box-shadow: none !important;
  }
  .reg :global(.ui-password__input) { padding-right: 40px; }
  .reg :global(.ui-password__toggle) { color: #8a93a3; }
  .reg :global(.ui-password__toggle:hover) { color: #d7dce5; transform: none; }
  .reg__input::placeholder { color: #667084; }
  .reg__input:hover,
  .reg :global(.ui-password__input:hover) {
    border-color: #3a4456 !important;
  }
  .reg__input:focus,
  .reg :global(.ui-password__input:focus) {
    outline: none;
    border-color: #5b7bb5 !important;
    box-shadow: none !important;
  }

  .reg__slot :global(.kind__title),
  .reg__slot :global(.contacts__title),
  .reg__slot :global(.terms__title),
  .reg__slot :global(.captcha__label),
  .reg__slot :global(.kind__name),
  .reg__slot :global(.contacts__field) {
    color: #eef1f6;
  }

  .reg__slot :global(.contacts__lead),
  .reg__slot :global(.kind__desc) {
    color: #8a93a3;
  }

  .reg__slot :global(.kind__card),
  .reg__slot :global(.terms__box),
  .reg__slot :global(.captcha__box),
  .reg__slot :global(.captcha__input),
  .reg__slot :global(.contacts__input),
  .reg__slot :global(.verify__card) {
    border-color: #2a3140;
    background: #121722;
    color: #f1f3f7;
    border-radius: 6px;
  }

  .reg__slot :global(.kind__grid) { gap: 8px; }
  .reg__slot :global(.kind__card) { min-height: 84px; padding: 12px; }
  .reg__slot :global(.kind__card.is-active),
  .reg__slot :global(.verify__card.is-active) {
    border-color: #5b7bb5;
    background: #152033;
    box-shadow: none;
  }

  .reg__slot :global(.captcha__refresh) {
    background: transparent;
    color: #8a93a3;
  }

  .reg__slot :global(.captcha__preview),
  .reg__slot :global(.captcha__image) {
    background: transparent;
  }

  .reg__slot :global(.terms__box) {
    color: #8a93a3;
    font-size: 12px;
    line-height: 1.5;
  }

  .reg__slot :global(.terms__check) { color: #c5ccd8; }

  .reg__submit {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    height: 44px;
    border: 0;
    border-radius: 6px;
    background: #3d5f99;
    color: #fff;
    font: inherit;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    margin-top: 4px;
  }
  .reg__submit:hover:not(:disabled) { background: #476bab; }
  .reg__submit:disabled { opacity: 0.5; cursor: not-allowed; }

  .reg__slot :global(.verify__card:hover:not(:disabled)),
  .reg__slot :global(.kind__card:hover) {
    transform: none;
    border-color: #3a4456;
  }
</style>
