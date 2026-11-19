<script lang="ts">
  /** Іконка-дія в рядку таблиці (документ, надіслати, видалити); підпис — у title / aria-label */
  import { Icon, type IconName } from '$lib/ui/elements';

  let {
    icon,
    label,
    href,
    tone = 'accent',
    disabled = false,
    onclick,
  }: {
    icon: IconName;
    label: string;
    href?: string;
    tone?: 'accent' | 'muted' | 'danger';
    disabled?: boolean;
    onclick?: () => void;
  } = $props();
</script>

{#snippet face()}
  <Icon name={icon} />
{/snippet}

{#if href && !disabled}
  <a class="act" data-tone={tone} {href} title={label} aria-label={label}>{@render face()}</a>
{:else}
  <button class="act" data-tone={tone} type="button" title={label} aria-label={label} {disabled} {onclick}>{@render face()}</button>
{/if}

<style lang="scss">
  .act {
    @include icon-button(28px);
    // Спокійний стан — токен теми (адмінка: сірі іконки), колір дії — при наведенні
    color: var(--ui-act-rest, var(--c));

    &[data-tone='accent'] { --c: var(--ui-accent); }
    &[data-tone='muted'] { --c: var(--ui-muted); }
    &[data-tone='danger'] { --c: var(--ui-danger); }

    &:hover {
      background: soft(var(--c), 12%);
      color: var(--c);
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }
</style>
