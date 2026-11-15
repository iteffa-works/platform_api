<script lang="ts">
  /** Показник для дашборду: іконка в тоні, підпис, значення, примітка / дельта */
  import type { Snippet } from 'svelte';
  import { Icon, type IconName } from '$lib/ui/elements';

  let {
    label,
    value,
    content,
    note,
    delta,
    icon,
    tone = 'blue',
    href,
  }: {
    label: string;
    value?: string | number;
    /** Значення розміткою (гроші / дата з форматуванням клієнта) — замість `value` */
    content?: Snippet;
    note?: string;
    /** Зміна: додатна — зелена, відʼємна — червона (напр. «+12%») */
    delta?: string;
    icon?: IconName;
    tone?: 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'slate';
    href?: string;
  } = $props();

  const trend = $derived(delta?.trim().startsWith('-') || delta?.trim().startsWith('−') ? 'down' : 'up');
</script>

<svelte:element this={href ? 'a' : 'div'} class="stat" data-tone={tone} {href}>
  {#if icon}<span class="stat__icon"><Icon name={icon} size={18} /></span>{/if}
  <span class="stat__body">
    <span class="stat__label">{label}</span>
    <strong class="stat__value">{#if content}{@render content()}{:else}{value ?? '—'}{/if}</strong>
    {#if note || delta}
      <span class="stat__note">
        {#if delta}<b data-trend={trend}>{delta}</b>{/if}
        {note ?? ''}
      </span>
    {/if}
  </span>
</svelte:element>

<style lang="scss">
  .stat {
    @include surface;
    @include focus-ring;
    @include tones;
    display: flex;
    align-items: flex-start;
    gap: space(3);
    padding: space(4);
    color: inherit;
    text-decoration: none;
    transition: box-shadow 0.15s, border-color 0.15s;
  }

  a.stat:hover {
    border-color: var(--ui-border);
    box-shadow: var(--ui-shadow-md);
  }

  .stat__icon {
    display: grid;
    flex: none;
    place-items: center;
    width: 38px;
    height: 38px;
    border-radius: var(--ui-radius-md);
    background: soft(var(--tone), 12%);
    color: var(--tone);
  }

  .stat__body {
    display: grid;
    gap: 2px;
    min-width: 0;
  }

  .stat__label {
    @include truncate;
    color: var(--ui-muted);
    font-size: var(--ui-fs-sm);
  }

  .stat__value {
    font-size: 24px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.01em;
  }

  .stat__note {
    color: var(--ui-muted);
    font-size: var(--ui-fs-xs);

    b[data-trend='up'] { color: var(--ui-success); }
    b[data-trend='down'] { color: var(--ui-danger); }
  }
</style>
