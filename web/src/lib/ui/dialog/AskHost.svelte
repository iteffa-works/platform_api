<script lang="ts">
  /** Хост вікон askConfirm / askPrompt: одне вікно за раз, Esc / фон — скасувати, Enter — підтвердити */
  import { tick } from 'svelte';
  import { useI18n } from '$lib/i18n';
  import { Icon } from '$lib/ui/elements';
  import { askRequest, type AskRequest } from './ask.js';

  const { t } = useI18n();

  let element = $state<HTMLDialogElement>();
  let input = $state<HTMLInputElement | HTMLTextAreaElement>();
  let request = $state<AskRequest | null>(null);
  let value = $state('');

  askRequest.subscribe(async (next) => {
    request = next;
    if (!next) {
      element?.close();
      return;
    }
    value = next.value ?? '';
    await tick();
    // showModal — у верхньому шарі, поверх уже відкритих модальних вікон
    if (element && !element.open) element.showModal();
    if (input) {
      input.focus();
      input.select();
    }
  });

  function finish(answer: string | boolean | null) {
    const current = request;
    askRequest.set(null);
    current?.resolve(answer);
  }

  const cancel = () => finish(request?.kind === 'confirm' ? false : null);

  function submit(event: Event) {
    event.preventDefault();
    finish(request?.kind === 'confirm' ? true : value);
  }
</script>

{#if request}
  <dialog
    bind:this={element}
    class="ask"
    aria-label={request.title ?? request.message}
    oncancel={(event) => { event.preventDefault(); cancel(); }}
    onclick={(event) => { if (event.target === element) cancel(); }}
  >
    <form class="ask__box" onsubmit={submit}>
      <div class="ask__body">
        <span class="ask__icon" class:is-danger={request.tone === 'danger'}>
          <Icon name={request.kind === 'prompt' ? 'edit' : request.tone === 'danger' ? 'alert' : 'help'} size={18} />
        </span>
        <div class="ask__text">
          {#if request.title}<h2>{request.title}</h2>{/if}
          <p class:is-lead={!request.title}>{request.message}</p>
          {#if request.kind === 'prompt'}
            {#if request.multiline}
              <textarea bind:this={input} bind:value rows="3"></textarea>
            {:else}
              <input bind:this={input} bind:value />
            {/if}
          {/if}
        </div>
      </div>
      <footer class="ask__foot">
        <button type="button" class="ask__btn" onclick={cancel}>{$t('common.cancel')}</button>
        <button type="submit" class="ask__btn is-primary" class:is-danger={request.tone === 'danger'}>
          {request.confirmLabel ?? (request.kind === 'prompt' ? $t('common.save') : $t('common.confirm'))}
        </button>
      </footer>
    </form>
  </dialog>
{/if}

<style>
  .ask {
    width: min(440px, calc(100vw - 32px));
    padding: 0;
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius-lg, 8px);
    background: var(--ui-surface);
    color: var(--ui-text);
    box-shadow: var(--ui-shadow-pop, 0 24px 64px rgba(15, 23, 42, 0.28));
  }

  .ask::backdrop {
    background: rgba(8, 10, 14, 0.55);
    backdrop-filter: blur(2px);
  }

  .ask__body {
    display: flex;
    gap: 14px;
    padding: 20px;
  }

  .ask__icon {
    display: grid;
    flex: none;
    place-items: center;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--ui-accent-soft, rgba(225, 29, 72, 0.12));
    color: var(--ui-accent);
  }

  .ask__icon.is-danger {
    background: color-mix(in srgb, var(--ui-danger, #dc2626) 14%, transparent);
    color: var(--ui-danger, #dc2626);
  }

  .ask__text {
    display: grid;
    flex: 1;
    gap: 10px;
    min-width: 0;
  }

  .ask__text h2 {
    margin: 0;
    font-size: 16px;
  }

  .ask__text p {
    margin: 0;
    color: var(--ui-muted);
    overflow-wrap: anywhere;
  }

  .ask__text p.is-lead {
    padding-top: 7px;
    color: var(--ui-text);
  }

  .ask input,
  .ask textarea {
    width: 100%;
    padding: 8px 10px;
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius, 4px);
    background: var(--ui-bg, var(--ui-surface));
    color: var(--ui-text);
    font: inherit;
  }

  .ask input {
    height: var(--ui-control-h, 36px);
  }

  .ask input:focus,
  .ask textarea:focus {
    border-color: var(--ui-accent);
    outline: none;
  }

  .ask__foot {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 12px 20px;
    border-top: 1px solid var(--ui-border);
    background: var(--ui-surface-muted, transparent);
  }

  .ask__btn {
    height: var(--ui-control-h, 36px);
    padding: 0 16px;
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius, 4px);
    background: var(--ui-surface);
    color: var(--ui-text);
    font: inherit;
    font-weight: 600;
    cursor: pointer;
  }

  .ask__btn:hover {
    border-color: var(--ui-border-strong, var(--ui-muted));
  }

  .ask__btn.is-primary {
    border-color: var(--ui-accent);
    background: var(--ui-accent);
    color: #fff;
  }

  .ask__btn.is-danger {
    border-color: var(--ui-danger, #dc2626);
    background: var(--ui-danger, #dc2626);
  }
</style>
