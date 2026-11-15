<script lang="ts">
  /** Кільце заповнення (диск, квоти): відсоток у центрі; null — «—» */
  let { value, size = 44 }: { value: number | null; size?: number } = $props();

  const R = 16;
  const LENGTH = 2 * Math.PI * R;
  const tone = $derived(value === null ? 'slate' : value >= 90 ? 'red' : value >= 70 ? 'orange' : 'blue');
</script>

<span class="ring" style:width="{size}px" style:height="{size}px" data-tone={tone}>
  <svg viewBox="0 0 40 40" aria-hidden="true">
    <circle class="track" cx="20" cy="20" r={R} />
    {#if value !== null}
      <circle class="bar" cx="20" cy="20" r={R} stroke-dasharray="{(LENGTH * value) / 100} {LENGTH}" />
    {/if}
  </svg>
  <span class="label">{value === null ? '—' : `${value}%`}</span>
</span>

<style>
  .ring {
    position: relative;
    display: inline-grid;
    flex: none;
    place-items: center;
  }

  svg {
    position: absolute;
    inset: 0;
    transform: rotate(-90deg);
  }

  circle {
    fill: none;
    stroke-width: 3.5;
  }

  .track {
    stroke: var(--ui-border);
  }

  .bar {
    stroke: var(--ring, var(--ui-tone-blue));
    stroke-linecap: round;
  }

  [data-tone='orange'] {
    --ring: var(--ui-tone-orange);
  }

  [data-tone='red'] {
    --ring: var(--ui-danger);
  }

  .label {
    font-size: 11px;
    font-weight: 700;
  }
</style>
