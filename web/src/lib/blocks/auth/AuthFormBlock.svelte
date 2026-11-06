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
  const submitLabel = $derived(resolveAuthSubmitLabel(mode, 'Увійти'));
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
    <h1 class="login__title">Вхід до кабінету</h1>
    <p class="login__lead">Увійдіть за email і паролем, щоб керувати сервісами платформи.</p>
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
    <button type="button" class="login__alt" disabled={busy} title="Passkey" aria-label="Passkey" onclick={() => soon('Passkey')}>
      <span class="login__mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round">
          <g transform="translate(1.2 1.2) scale(0.9)">
            <path stroke="#EA4335" d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"/>
            <path stroke="#4285F4" d="M14 13.12c0 2.38 0 6.38-1 8.88"/>
            <path stroke="#34A853" d="M17.29 21.02c.12-.6.43-2.3.5-3.02"/>
            <path stroke="#FBBC05" d="M2 12a10 10 0 0 1 18-6"/>
            <path stroke="#EA4335" d="M2 16h.01"/>
            <path stroke="#4285F4" d="M21.8 16c.2-2 .131-5.354 0-6"/>
            <path stroke="#34A853" d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2"/>
            <path stroke="#FBBC05" d="M8.65 22c.21-.66.45-1.32.57-2"/>
            <path stroke="#EA4335" d="M9 6.8a6 6 0 0 1 9 5.2v2"/>
          </g>
        </svg>
      </span>
    </button>
    <button type="button" class="login__alt" disabled={busy} title="Google" aria-label="Google" onclick={() => soon('Google')}>
      <span class="login__mark" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <g transform="translate(2.2 2.2) scale(0.816)">
            <path fill="#4285F4" d="M21.35 11.1H12v2.9h5.3c-.23 1.25-1.55 3.66-5.3 3.66-3.19 0-5.79-2.63-5.79-5.86S8.81 5.94 12 5.94c1.81 0 3.03.77 3.73 1.43l2.54-2.45C16.88 3.44 14.66 2.4 12 2.4 6.96 2.4 2.9 6.46 2.9 11.5S6.96 20.6 12 20.6c5.18 0 8.6-3.63 8.6-8.75 0-.59-.07-1.03-.25-.75z"/>
            <path fill="#34A853" d="M4.75 7.74 7.7 9.9c.8-1.55 2.4-2.66 4.3-2.66 1.81 0 3.03.77 3.73 1.43l2.54-2.45C16.88 3.44 14.66 2.4 12 2.4 8.7 2.4 5.85 4.3 4.75 7.74z"/>
            <path fill="#FBBC05" d="M12 20.6c2.45 0 4.5-.8 5.99-2.18l-2.85-2.21c-.8.54-1.86.97-3.14.97-2.4 0-4.44-1.6-5.17-3.8L3.9 15.3C5.2 18.55 8.3 20.6 12 20.6z"/>
            <path fill="#EA4335" d="M6.83 14.38c-.2-.54-.32-1.12-.32-1.72s.12-1.18.32-1.72L3.9 8.7C3.3 9.95 2.9 11.2 2.9 12.5s.4 2.55 1 3.8l2.93-1.92z"/>
          </g>
        </svg>
      </span>
    </button>
    <button type="button" class="login__alt" disabled={busy} title="Microsoft" aria-label="Microsoft" onclick={() => soon('Microsoft')}>
      <span class="login__mark" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <g transform="translate(3.2 3.2) scale(0.733)">
            <path fill="#F25022" d="M1 1h10v10H1z"/>
            <path fill="#7FBA00" d="M13 1h10v10H13z"/>
            <path fill="#00A4EF" d="M1 13h10v10H1z"/>
            <path fill="#FFB900" d="M13 13h10v10H13z"/>
          </g>
        </svg>
      </span>
    </button>
    <button type="button" class="login__alt" disabled={busy} title="Facebook" aria-label="Facebook" onclick={() => soon('Facebook')}>
      <span class="login__mark" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <g transform="translate(3.4 2.4) scale(0.72)">
            <path fill="#1877F2" d="M14.05 21.5v-7.2h2.42l.36-2.82h-2.78v-1.8c0-.82.23-1.37 1.42-1.37h1.52V5.72c-.26-.03-1.16-.11-2.2-.11-2.18 0-3.67 1.33-3.67 3.77v2.1H8.45v2.82h2.67v7.2h2.93z"/>
          </g>
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

  .login__head { display: grid; gap: 6px; margin-bottom: 4px; min-height: 3.35rem; }
  .login__title {
    margin: 0;
    font-size: clamp(1.28rem, 1.9vw, 1.58rem);
    font-weight: 650;
    line-height: 1.28;
    letter-spacing: -0.025em;
    color: #f3f5f8;
  }
  .login__lead { margin: 0; font-size: 12.5px; color: #8790a0; line-height: 1.45; }
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
    height: 40px;
    padding: 0 12px;
    border: 1px solid #1c2230 !important;
    border-radius: 4px !important;
    background: #0a0e15 !important;
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
    border-color: #1c2230;
    background: #0a0e15;
    color: #f1f3f7;
    border-radius: 4px;
  }
  .login__slot :global(.captcha__box) { height: 40px; }
  .login__slot :global(.captcha__input) { height: 40px; }
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
    height: 40px;
    border: 0;
    border-radius: 4px;
    background: #355486;
    color: #fff;
    font: inherit;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.01em;
    cursor: pointer;
  }
  .login__submit:hover:not(:disabled) { background: #3d6199; }
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
    background: #1c2230;
  }

  .login__alts {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px;
  }
  .login__alt {
    display: grid;
    place-items: center;
    height: 40px;
    padding: 0;
    border: 1px solid #1c2230;
    border-radius: 4px;
    background: #0a0e15;
    cursor: pointer;
  }
  .login__alt:hover:not(:disabled) {
    background: #10151e;
    border-color: #2a3344;
  }
  .login__alt:focus-visible {
    outline: 2px solid #5b7bb5;
    outline-offset: 1px;
  }
  .login__alt:disabled { opacity: 0.5; cursor: not-allowed; }

  .login__mark {
    width: 22px;
    height: 22px;
    display: grid;
    place-items: center;
    flex: 0 0 22px;
  }
  .login__mark svg {
    width: 22px;
    height: 22px;
    display: block;
    overflow: visible;
  }

  .login__secondary {
    display: grid;
    place-items: center;
    height: 40px;
    margin-top: 2px;
    border: 1px solid #1c2230;
    border-radius: 4px;
    background: transparent;
    color: #9aa3b2;
    text-decoration: none;
    font-size: 13px;
    font-weight: 600;
  }
  .login__secondary:hover {
    background: #0a0e15;
    border-color: #2a3344;
    color: #eef1f6;
  }
</style>
