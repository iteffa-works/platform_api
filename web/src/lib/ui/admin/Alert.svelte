<script lang="ts">
  /** Плашка-повідомлення над таблицею (прогрес задачі, попередження); праворуч — дія або закриття */
  import { Icon, type IconName } from '$lib/ui/elements';
  import type { Snippet } from 'svelte';

  type Tone = 'info' | 'warn' | 'danger' | 'success';

  let {
    tone = 'info',
    children,
    action,
    onclose,
    closeLabel = 'Close',
  }: {
    tone?: Tone;
    children: Snippet;
    action?: Snippet;
    onclose?: () => void;
    closeLabel?: string;
  } = $props();

  const ICON: Record<Tone, IconName> = { info: 'info', warn: 'alert', danger: 'alert', success: 'info' };
</script>

<div class="alert" data-tone={tone} role={tone === 'danger' ? 'alert' : 'status'}>
  <Icon name={ICON[tone]} />
  <div class="alert__text">{@render children()}</div>
  {#if action}{@render action()}{/if}
  {#if onclose}
    <button class="alert__close" type="button" onclick={onclose} aria-label={closeLabel}><Icon name="close" size={14} /></button>
  {/if}
</div>

<style lang="scss">
  .alert {
    display: flex;
    align-items: center;
    gap: space(3);
    padding: space(2) + 2px space(4);
    border: 1px solid tint(var(--tone), 35%);
    border-radius: var(--ui-radius-md);
    background: var(--bg);
    color: var(--ui-text-2);
    font-size: var(--ui-fs-sm);

    > :global(.ui-icon) {
      color: var(--tone);
    }

    &[data-tone='info'] { --tone: var(--ui-accent); --bg: var(--ui-accent-soft); }
    &[data-tone='warn'] { --tone: var(--ui-warn); --bg: var(--ui-warn-soft); }
    &[data-tone='danger'] { --tone: var(--ui-danger); --bg: var(--ui-danger-soft); }
    &[data-tone='success'] { --tone: var(--ui-success); --bg: #{soft(var(--ui-success), 10%)}; }
  }

  .alert__text {
    flex: 1;
    min-width: 0;

    :global(b) {
      color: var(--ui-text);
    }
  }

  .alert__close {
    @include icon-button(24px);
  }
</style>
