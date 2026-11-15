<script lang="ts">
  /** Модальне вікно схеми: заголовок, вузли (зазвичай форма), помилка дії всередині; Esc / фон — закрити */
  import { onMount } from 'svelte';
  import { ErrorText } from '$lib/ui/components';
  import { Icon } from '$lib/ui/elements';
  import { useRemote } from './context.js';
  import type { UiNode as Node } from './schema.js';
  import UiNode from './UiNode.svelte';

  let { title, nodes, onclose }: { title: string; nodes: Node[]; onclose: () => void } = $props();

  const remote = useRemote();
  const error = remote.error;
  let element: HTMLDialogElement;

  onMount(() => {
    element.showModal();
    return () => element.close();
  });
</script>

<dialog
  bind:this={element}
  class="dialog"
  aria-label={title}
  oncancel={(event) => { event.preventDefault(); onclose(); }}
  onclick={(event) => { if (event.target === element) onclose(); }}
>
  <div class="dialog__box">
    <header class="dialog__head">
      <h2>{title}</h2>
      <button type="button" class="dialog__close" aria-label="×" onclick={onclose}><Icon name="plus" size={18} /></button>
    </header>
    <div class="dialog__body">
      <ErrorText message={$error} />
      {#each nodes as node, index (index)}<UiNode {node} />{/each}
    </div>
  </div>
</dialog>

<style>
  .dialog {
    width: min(560px, calc(100vw - 32px));
    max-height: calc(100vh - 48px);
    padding: 0;
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius-lg, 12px);
    background: var(--ui-surface);
    color: var(--ui-text);
    box-shadow: var(--ui-shadow-pop, 0 24px 64px rgba(15, 23, 42, 0.28));
  }

  .dialog::backdrop {
    background: rgba(15, 23, 42, 0.45);
    backdrop-filter: blur(2px);
  }

  .dialog__box {
    display: flex;
    flex-direction: column;
    max-height: calc(100vh - 48px);
  }

  .dialog__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 16px 20px;
    border-bottom: 1px solid var(--ui-border-soft, var(--ui-border));
  }

  .dialog__head h2 {
    margin: 0;
    font-size: 16px;
  }

  .dialog__close {
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border: 0;
    border-radius: 8px;
    background: none;
    color: var(--ui-muted);
    cursor: pointer;
    transform: rotate(45deg);
  }

  .dialog__close:hover {
    background: var(--ui-surface-muted);
    color: var(--ui-text);
  }

  .dialog__body {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 20px;
    overflow: auto;
  }
</style>
