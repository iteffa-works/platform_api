<script lang="ts">
  /** Іконка-дія в рядку таблиці (документ, надіслати, видалити); підпис — у title / aria-label */
  import { Icon, type IconName } from '$lib/ui/elements';
  import Glyph, { GLYPHS, type GlyphName } from './Glyph.svelte';

  let {
    icon,
    label,
    href,
    tone = 'accent',
    disabled = false,
    onclick,
  }: {
    icon: IconName | GlyphName;
    label: string;
    href?: string;
    tone?: 'accent' | 'muted' | 'danger';
    disabled?: boolean;
    onclick?: () => void;
  } = $props();

  const isGlyph = $derived(icon in GLYPHS);
</script>

{#snippet face()}
  {#if isGlyph}<Glyph name={icon as GlyphName} />{:else}<Icon name={icon as IconName} />{/if}
{/snippet}

{#if href && !disabled}
  <a class="act" data-tone={tone} {href} title={label} aria-label={label}>{@render face()}</a>
{:else}
  <button class="act" data-tone={tone} type="button" title={label} aria-label={label} {disabled} {onclick}>{@render face()}</button>
{/if}

<style lang="scss">
  .act {
    @include icon-button(28px);
    color: var(--c);

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
