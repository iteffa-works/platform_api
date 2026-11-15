<script lang="ts">
  /** Кнопка схеми: перехід (href), дія (REST) або модальне вікно (dialog); варіант `link` — як посилання */
  import { Button, Icon, type IconName } from '$lib/ui/elements';
  import { useRemote } from './context.js';
  import type { UiButton } from './schema.js';
  import UiDialog from './UiDialog.svelte';

  let { node, className = '', onpress }: { node: UiButton; className?: string; onpress?: () => void } = $props();

  const remote = useRemote();
  const busy = remote.busy;
  const dialog = remote.dialog;
  const icon = $derived(node.icon as IconName | undefined);
  const open = $derived(Boolean(node.dialog) && $dialog === node.dialog?.title);
  const disabled = $derived($busy || node.disabled);

  function press() {
    onpress?.();
    if (node.dialog) dialog.set(node.dialog.title);
    else if (node.action) void remote.run(node.action);
  }
</script>

{#if node.href && !node.disabled && !node.dialog}
  {#if node.variant === 'link' || className}
    <a class="{node.variant === 'link' ? 'linkbtn' : ''} {className}" href={node.href} title={node.title} onclick={onpress}>
      {#if icon}<Icon name={icon} />{/if}{node.label}
    </a>
  {:else}
    <Button variant={node.variant === 'danger' ? 'danger' : node.variant ?? 'primary'} size={node.size ?? 'md'} href={node.href}>
      {#if icon}<Icon name={icon} />{/if}{node.label}
    </Button>
  {/if}
{:else if node.variant === 'link' || className}
  <button type="button" class="{node.variant === 'link' ? 'linkbtn' : ''} {className}" class:is-danger={node.variant === 'danger'} {disabled} title={node.title} onclick={press}>
    {#if icon}<Icon name={icon} />{/if}{node.label}
  </button>
{:else}
  <Button variant={node.variant ?? 'primary'} size={node.size ?? 'md'} {disabled} onclick={press}>
    {#if icon}<Icon name={icon} />{/if}{node.label}
  </Button>
{/if}

{#if open && node.dialog}
  <UiDialog title={node.dialog.title} nodes={node.dialog.nodes} onclose={() => dialog.set(null)} />
{/if}

<style>
  .linkbtn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ui-accent);
    font: inherit;
    font-size: 14px;
    text-align: left;
    text-decoration: none;
    cursor: pointer;
  }

  .linkbtn:hover {
    text-decoration: underline;
  }

  .linkbtn:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
</style>
