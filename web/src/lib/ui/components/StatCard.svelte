<script lang="ts">
  /**
   * Картка показника.
   * З `accent` — кольорова ліва межа й іконка, значення праворуч (кабінет);
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
  <article class="ui-stat is-accent" style:--tone="var(--ui-tone-{accent})">
    <div class="ui-stat__main">
      {#if icon}<span class="ui-stat__icon"><Icon name={icon} size={18} /></span>{/if}
      <div>
        <p class="ui-stat__label">{label}</p>
        {#if note}<p class="ui-stat__note">{note}</p>{/if}
      </div>
    </div>
    <p class="ui-stat__value">{value}</p>
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
    padding: 16px 18px;
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius);
    background: var(--ui-surface);
  }

  .ui-stat.is-column {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }

  .ui-stat.is-accent {
    border-left: 3px solid var(--tone);
  }

  .ui-stat__main {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }

  .ui-stat__icon {
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border: 1px solid var(--tone);
    border-radius: var(--ui-radius);
    color: var(--tone);
  }

  .ui-stat__label {
    margin: 0;
    color: var(--ui-muted);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .ui-stat__note {
    margin: 4px 0 0;
    color: var(--ui-muted);
    font-size: 12px;
  }

  .ui-stat.is-column .ui-stat__note {
    margin: 0;
  }

  .ui-stat__value {
    margin: 0;
    font-size: 1.6rem;
    font-weight: 700;
    line-height: 1.1;
  }
</style>
