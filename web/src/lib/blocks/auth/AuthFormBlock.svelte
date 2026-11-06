<script lang="ts">
  /** Login form — corporate flat */
  import { goto } from '$app/navigation';
  import { type AuthMode } from '$lib/domain/auth/config';
  import {
    collectAuthExtensionFields,
    listAuthExtensionHints,
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

  let { mode = 'login' }: { mode?: AuthMode } = $props();

  let email = $state('');
  let password = $state('');
  let error = $state('');
  let busy = $state(false);

  const endpoint = $derived(resolveAuthEndpoint(mode, '/auth/login'));
  const submitLabel = $derived(resolveAuthSubmitLabel(mode, 'Кнопка входу'));
  const extensionSlots = $derived(listAuthExtensionSlots(mode));
  const emailHints = $derived(listAuthExtensionHints('email', mode));
  const passwordHints = $derived(listAuthExtensionHints('password', mode));

  function soon(name: string) {
    error = `${name} відключено адміністратором`;
  }

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

<form class="login" onsubmit={submit}>
  <header class="login__head">
    <h1 class="login__title">Заголовок входу</h1>
    <p class="login__lead">Підзаголовок: коротке пояснення до форми авторизації</p>
  </header>

  <div class="login__field">
    <Label>
      Email
      <input
        class="login__input"
        type="email"
        bind:value={email}
        autocomplete="email"
        required
        placeholder="email@example.com"
      />
    </Label>
    {#if emailHints.length}
      <div class="login__hints">
        {#each emailHints as hint (hint.id)}
          <a class={hint.tone === 'soft' ? 'login__soft' : 'login__link'} href={hint.href}>{hint.label}</a>
        {/each}
      </div>
    {/if}
  </div>

  <div class="login__field">
    <PasswordField label="Пароль" bind:value={password} autocomplete="current-password" required minlength={8} />
    {#if passwordHints.length}
      <div class="login__hints">
        {#each passwordHints as hint (hint.id)}
          <a class="login__link" href={hint.href}>{hint.label}</a>
        {/each}
      </div>
    {/if}
  </div>

  {#each extensionSlots as slot (slot.id)}
    {@const Cmp = slot.component}
    <div class="login__slot"><Cmp {...(slot.props ?? {})} /></div>
  {/each}

  <ErrorText message={error} />

  <button class="login__submit" type="submit" disabled={busy}>
    {submitLabel}
    <span aria-hidden="true">→</span>
  </button>

  <div class="login__or"><span>або</span></div>

  <div class="login__alts" role="group" aria-label="Швидкий вхід">
    <button type="button" class="login__alt" disabled={busy} title="Дія" aria-label="Дія" onclick={() => soon('Дія')}>
      <span class="login__mark" aria-hidden="true">
        <svg viewBox="0 0 32 32">
          <rect width="32" height="32" rx="8" fill="#0A0A0A"/>
          <text x="16" y="20.5" text-anchor="middle" fill="#fff" font-size="11" font-weight="700" font-family="Arial,Helvetica,sans-serif">Дія</text>
        </svg>
      </span>
    </button>
    <button type="button" class="login__alt" disabled={busy} title="BankID" aria-label="BankID" onclick={() => soon('BankID')}>
      <span class="login__mark" aria-hidden="true">
        <svg viewBox="0 0 32 32">
          <defs>
            <clipPath id="bid-r"><rect width="32" height="32" rx="8"/></clipPath>
          </defs>
          <g clip-path="url(#bid-r)">
            <rect width="32" height="16" fill="#0057B8"/>
            <rect y="16" width="32" height="16" fill="#FFD700"/>
          </g>
          <circle cx="16" cy="16" r="8" fill="#061428"/>
          <text x="16" y="19.2" text-anchor="middle" fill="#fff" font-size="9" font-weight="700" font-family="Arial,Helvetica,sans-serif" letter-spacing="0.6">ID</text>
        </svg>
      </span>
    </button>
    <button type="button" class="login__alt" disabled={busy} title="Google" aria-label="Google" onclick={() => soon('Google')}>
      <span class="login__mark login__mark--light" aria-hidden="true">
        <svg viewBox="0 0 32 32">
          <rect width="32" height="32" rx="8" fill="#fff"/>
          <g transform="translate(4 4)">
            <path fill="#EA4335" d="M12 10.2v3.6h5.1c-.2 1.2-1.5 3.6-5.1 3.6-3.1 0-5.6-2.5-5.6-5.6S8.9 6.2 12 6.2c1.8 0 3 .7 3.7 1.4l2.5-2.4C16.7 3.7 14.5 2.7 12 2.7 6.9 2.7 2.7 6.9 2.7 12S6.9 21.3 12 21.3c5.5 0 9.1-3.9 9.1-9.3 0-.6-.1-1.1-.2-1.8H12z"/>
            <path fill="#34A853" d="M3.9 7.5 6.9 9.7C7.7 7.7 9.7 6.2 12 6.2c1.8 0 3 .7 3.7 1.4l2.5-2.4C16.7 3.7 14.5 2.7 12 2.7 8.3 2.7 5.1 4.8 3.9 7.5z"/>
            <path fill="#4A90E2" d="M12 21.3c2.4 0 4.5-.8 6-2.2l-2.9-2.2c-.8.5-1.8.9-3.1.9-2.4 0-4.4-1.6-5.1-3.8l-3 2.3C5.1 19.2 8.3 21.3 12 21.3z"/>
            <path fill="#FBBC05" d="M6.9 14c-.2-.5-.3-1-.3-1.6s.1-1.1.3-1.6L3.9 8.5C3.3 9.6 3 10.8 3 12s.3 2.4.9 3.5L6.9 14z"/>
          </g>
        </svg>
      </span>
    </button>
    <button type="button" class="login__alt" disabled={busy} title="Microsoft" aria-label="Microsoft" onclick={() => soon('Microsoft')}>
      <span class="login__mark login__mark--light" aria-hidden="true">
        <svg viewBox="0 0 32 32">
          <rect width="32" height="32" rx="8" fill="#fff"/>
          <rect x="7" y="7" width="8" height="8" fill="#F25022"/>
          <rect x="17" y="7" width="8" height="8" fill="#7FBA00"/>
          <rect x="7" y="17" width="8" height="8" fill="#00A4EF"/>
          <rect x="17" y="17" width="8" height="8" fill="#FFB900"/>
        </svg>
      </span>
    </button>
  </div>

  <a class="login__secondary" href="/register">Створити акаунт</a>
</form>

<style>
  .login {
    display: grid;
    gap: 14px;
    color: #d7dce5;
  }

  .login__head { display: grid; gap: 6px; margin-bottom: 4px; }
  .login__title {
    margin: 0;
    font-size: 1.32rem;
    font-weight: 650;
    letter-spacing: -0.025em;
    color: #f3f5f8;
  }
  .login__lead { margin: 0; font-size: 13px; color: #8790a0; line-height: 1.45; }
  .login__field { display: grid; gap: 6px; }

  .login :global(.ui-label) {
    gap: 5px;
    font-size: 12px;
    font-weight: 600;
    color: #9aa3b2;
  }

  .login__input,
  .login :global(.ui-password__input) {
    width: 100%;
    height: 42px;
    padding: 0 12px;
    border: 1px solid #1e2430 !important;
    border-radius: 8px !important;
    background: #0c1017 !important;
    color: #f1f3f7 !important;
    font: inherit !important;
    box-shadow: none !important;
  }
  .login :global(.ui-password__input) { padding-right: 38px; }
  .login :global(.ui-password__toggle) { color: #8a93a3; }
  .login :global(.ui-password__toggle:hover) { color: #d7dce5; }
  .login__input::placeholder { color: #667084; }
  .login__input:hover,
  .login :global(.ui-password__input:hover) {
    border-color: #3a4456 !important;
  }
  .login__input:focus,
  .login :global(.ui-password__input:focus) {
    outline: none;
    border-color: #5b7bb5 !important;
    box-shadow: none !important;
  }

  .login__hints { display: flex; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
  .login__link, .login__soft {
    text-decoration: none;
    font-size: 12px;
    font-weight: 500;
  }
  .login__link { color: #8fa3c7; }
  .login__soft { color: #7dba8f; }
  .login__link:hover, .login__soft:hover { text-decoration: underline; }

  .login__slot :global(.captcha__label),
  .login__slot :global(.captcha__refresh) { color: #9aa3b2; }
  .login__slot :global(.captcha__box),
  .login__slot :global(.captcha__input) {
    border-color: #1e2430;
    background: #0c1017;
    color: #f1f3f7;
    border-radius: 8px;
  }
  .login__slot :global(.captcha__box) { height: 42px; }
  .login__slot :global(.captcha__input) { height: 42px; }
  .login__slot :global(.captcha__refresh) {
    background: transparent;
    color: #8a93a3;
  }
  .login__slot :global(.captcha__refresh:hover:not(:disabled)) {
    color: #d7dce5;
    background: #121722;
    transform: none;
  }
  .login__slot :global(.captcha__preview),
  .login__slot :global(.captcha__image) { background: transparent; }

  .login__submit {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: 100%;
    height: 42px;
    border: 0;
    border-radius: 8px;
    background: #3d5f99;
    color: #fff;
    font: inherit;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
  }
  .login__submit:hover:not(:disabled) { background: #476bab; }
  .login__submit:disabled { opacity: 0.5; cursor: not-allowed; }

  .login__or {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    gap: 12px;
    align-items: center;
    margin: 2px 0;
    color: #6b7382;
    font-size: 10px;
    font-weight: 650;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .login__or span {
    padding: 0 2px;
  }
  .login__or::before, .login__or::after {
    content: '';
    height: 1px;
    background: linear-gradient(90deg, transparent, #2a3140 20%, #2a3140 80%, transparent);
  }

  .login__alts {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px;
  }
  .login__alt {
    display: grid;
    place-items: center;
    height: 44px;
    padding: 0;
    border: 1px solid #1e2430;
    border-radius: 8px;
    background: #0c1017;
    cursor: pointer;
  }
  .login__alt:hover:not(:disabled) {
    background: #121722;
    border-color: #2c3444;
  }
  .login__alt:focus-visible {
    outline: 2px solid #5b7bb5;
    outline-offset: 1px;
  }
  .login__alt:disabled { opacity: 0.5; cursor: not-allowed; }

  .login__mark {
    width: 28px;
    height: 28px;
    display: block;
    border-radius: 7px;
    overflow: hidden;
    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.04);
  }
  .login__mark svg {
    width: 100%;
    height: 100%;
    display: block;
  }

  .login__secondary {
    display: grid;
    place-items: center;
    height: 42px;
    margin-top: 2px;
    border: 1px solid #1e2430;
    border-radius: 8px;
    background: transparent;
    color: #9aa3b2;
    text-decoration: none;
    font-size: 13px;
    font-weight: 600;
  }
  .login__secondary:hover {
    background: #0c1017;
    border-color: #2c3444;
    color: #eef1f6;
  }
</style>
