<script lang="ts">
  /** Охайна flat-капча в ритмі полів форми */
  import { onMount } from 'svelte';
  import { api } from '$lib/core/api';
  import {
    onCaptchaRefreshRequest,
    resetCaptchaAnswer,
    setCaptchaAnswer,
    setCaptchaToken,
  } from '$lib/domain/auth/extensions/captcha';

  let image = $state('');
  let answer = $state('');
  let loading = $state(false);
  let loadError = $state('');

  async function loadChallenge() {
    loading = true;
    loadError = '';
    try {
      const data = await api<{
        enabled: boolean;
        captchaToken: string;
        image: string;
      }>('/auth/captcha');

      if (!data.enabled) {
        setCaptchaToken('disabled');
        setCaptchaAnswer('disabled');
        image = '';
        answer = '';
        return;
      }

      image = data.image;
      setCaptchaToken(data.captchaToken);
      answer = '';
      resetCaptchaAnswer();
    } catch (err) {
      loadError = err instanceof Error ? err.message : 'Не вдалося завантажити капчу';
      setCaptchaToken('');
      resetCaptchaAnswer();
    } finally {
      loading = false;
    }
  }

  $effect(() => {
    setCaptchaAnswer(answer);
  });

  onMount(() => {
    void loadChallenge();
    return onCaptchaRefreshRequest(() => {
      void loadChallenge();
    });
  });
</script>

<div class="captcha">
  <label class="captcha__label" for="auth-captcha-answer">Код з зображення</label>

  <div class="captcha__box">
    <div class="captcha__preview" class:is-loading={loading}>
      {#if image}
        <img class="captcha__image" src={image} alt="" />
      {:else}
        <span class="captcha__empty">{loading ? '…' : '—'}</span>
      {/if}
    </div>
    <button
      class="captcha__refresh"
      type="button"
      aria-label="Оновити код"
      title="Оновити"
      disabled={loading}
      onclick={() => void loadChallenge()}
    >
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <path fill="currentColor" d="M17.65 6.35A7.95 7.95 0 0 0 12 4V1L7 6l5 5V7c2.76 0 5 2.24 5 5a5 5 0 0 1-8.66 3.44l-1.42 1.42A6.97 6.97 0 0 0 19 12c0-1.93-.78-3.68-2.05-4.95ZM6 12c0-1.1.3-2.14.83-3.04l-1.5-1.3A6.97 6.97 0 0 0 5 12c0 3.53 2.61 6.43 6 6.92V21l5-5-5-5v2.1A5.01 5.01 0 0 1 6 12Z"/>
      </svg>
    </button>
  </div>

  <input
    id="auth-captcha-answer"
    class="captcha__input"
    type="text"
    inputmode="text"
    autocomplete="off"
    spellcheck="false"
    maxlength={8}
    placeholder="Введіть код"
    bind:value={answer}
    disabled={loading}
    required
  />

  {#if loadError}
    <p class="captcha__error">{loadError}</p>
  {/if}
</div>

<style>
  .captcha {
    display: grid;
    gap: 6px;
  }

  .captcha__label {
    font-size: 13px;
    font-weight: 600;
    color: var(--ui-text);
  }

  .captcha__box {
    display: grid;
    grid-template-columns: 1fr 40px;
    height: var(--ui-control-h);
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius);
    background: var(--ui-surface);
    overflow: hidden;
  }

  .captcha__preview {
    display: grid;
    place-items: center;
    min-width: 0;
    padding: 0 10px;
    background: transparent;
  }

  .captcha__preview.is-loading {
    opacity: 0.45;
  }

  .captcha__image {
    display: block;
    width: 100%;
    max-width: 200px;
    height: 36px;
    object-fit: contain;
    object-position: left center;
  }

  .captcha__empty {
    color: var(--ui-muted);
    font-size: 13px;
  }

  .captcha__refresh {
    border: 0;
    border-left: 1px solid color-mix(in srgb, var(--ui-border) 70%, transparent);
    background: transparent;
    color: var(--ui-muted);
    cursor: pointer;
    display: grid;
    place-items: center;
    transition: color 0.2s ease, background 0.2s ease;
  }

  .captcha__refresh:hover:not(:disabled) {
    color: var(--ui-text);
    background: color-mix(in srgb, var(--ui-surface-muted) 80%, transparent);
  }

  .captcha__refresh:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .captcha__input {
    width: 100%;
    height: var(--ui-control-h);
    padding: 0 12px;
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius);
    background: var(--ui-surface);
    color: var(--ui-text);
    font: inherit;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }

  .captcha__input::placeholder {
    letter-spacing: normal;
    text-transform: none;
    color: var(--ui-muted);
  }

  .captcha__input:focus {
    outline: none;
    border-color: var(--ui-focus);
  }

  .captcha__error {
    margin: 0;
    color: var(--ui-danger);
    font-size: 13px;
  }
</style>
