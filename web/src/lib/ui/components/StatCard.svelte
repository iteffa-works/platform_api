<script lang="ts">
  /**
   * Картка показника.
   * З `accent` — тонована іконка ліворуч, підпис, значення, примітка (як плитки адмінки);
   * без нього — підпис, значення, примітка стовпчиком (адмінка).
   */
  import { Icon, type IconName } from '$lib/ui/elements';

  type Tone = 'blue' | 'purple' | 'green' | 'orange' | 'slate';

  let {
    label,
    value,
    note = '',
    icon,
    accent,
  }: {
    label: string;
    value: string | number;
    note?: string;
    icon?: IconName;
    accent?: Tone;
  } = $props();
</script>

{#if accent}
  <!-- Як плитка показника адмінки: іконка ліворуч, підпис, значення, примітка -->
  <article class="ui-stat is-accent" style:--tone="var(--ui-tone-{accent})">
    <div class="ui-stat__main">
      {#if icon}<span class="ui-stat__icon"><Icon name={icon} size={18} /></span>{/if}
      <div class="ui-stat__body">
        <p class="ui-stat__label">{label}</p>
        <p class="ui-stat__value">{value}</p>
        {#if note}<p class="ui-stat__note">{note}</p>{/if}
      </div>
    </div>
  </article>
{:else}
  <article class="ui-stat is-column">
    <p class="ui-stat__label">{label}</p>
    <p class="ui-stat__value">{value}</p>
    {#if note}<p class="ui-stat__note">{note}</p>{/if}
  </article>
{/if}

<style>
  .ui-stat {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-width: 0;
    padding: var(--ui-stat-pad, 16px 18px);
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius-lg, var(--ui-radius));
    background: var(--ui-surface);
  }

  .ui-stat.is-column {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }

  .ui-stat.is-accent .ui-stat__icon {
    background: color-mix(in srgb, var(--tone) 12%, transparent);
  }

  .ui-stat__main {
    display: flex;
    align-items: center;
    gap: 14px;
    min-width: 0;
  }

  .ui-stat__icon {
    display: grid;
    place-items: center;
    flex: none;
    width: var(--ui-stat-icon, 36px);
    height: var(--ui-stat-icon, 36px);
    border: 1px solid color-mix(in srgb, var(--tone) 40%, transparent);
    border-radius: var(--ui-radius-md, var(--ui-radius));
    color: var(--tone);
  }

  .ui-stat__label {
    margin: 0;
    color: var(--ui-muted);
    font-size: var(--ui-fs-xs, 12px);
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .ui-stat__body {
    display: grid;
    gap: 2px;
    min-width: 0;
  }

  .ui-stat__note {
    margin: 2px 0 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--ui-muted);
    font-size: 12px;
  }

  .ui-stat.is-column .ui-stat__note {
    margin: 0;
  }

  .ui-stat__value {
    margin: 0;
    font-size: var(--ui-stat-value, 1.6rem);
    font-weight: 800;
    line-height: 1.15;
    white-space: nowrap;
  }
</style>
