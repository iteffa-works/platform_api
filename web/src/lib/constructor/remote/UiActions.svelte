<script lang="ts">
  /** Іконки-дії рядка: перехід, REST-дія (з підтвердженням) або модальне вікно; підпис — підказка */
  import { IconAction } from '$lib/ui/admin';
  import type { IconName } from '$lib/ui/elements';
  import { useRemote } from './context.js';
  import type { UiButton } from './schema.js';
  import UiDialog from './UiDialog.svelte';

  let { items }: { items: UiButton[] } = $props();

  const remote = useRemote();
  const busy = remote.busy;
  const dialog = remote.dialog;

  const visible = $derived(items.filter((item) => item.icon));

  function press(item: UiButton) {
    if (item.dialog) dialog.set(item.dialog.title);
    else if (item.action) void remote.run(item.action);
  }
</script>

<span class="acts">
  {#each visible as item, index (index)}
    <IconAction
      icon={item.icon as IconName}
      label={item.title ?? item.label}
      href={item.dialog ? undefined : item.href}
      tone={item.variant === 'danger' ? 'danger' : item.variant === 'ghost' ? 'muted' : 'accent'}
      disabled={$busy || item.disabled}
      onclick={() => press(item)}
    />
    {#if item.dialog && $dialog === item.dialog.title}
      <UiDialog title={item.dialog.title} nodes={item.dialog.nodes} onclose={() => dialog.set(null)} />
    {/if}
  {/each}
</span>

<style>
  .acts {
    display: inline-flex;
    align-items: center;
    gap: 2px;
  }
</style>
