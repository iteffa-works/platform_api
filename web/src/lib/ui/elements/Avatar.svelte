<script lang="ts">
  /** Аватар: завантажене зображення або ідентикон — симетрична сітка 5×5 з хешу рядка (email) */
  let { seed, src = null, size = 28 }: { seed: string; src?: string | null; size?: number } = $props();

  function hash(text: string): number {
    let value = 2166136261;
    for (let i = 0; i < text.length; i += 1) {
      value ^= text.charCodeAt(i);
      value = Math.imul(value, 16777619);
    }
    return value >>> 0;
  }

  const bits = $derived(hash(seed));
  const color = $derived(`hsl(${bits % 360} 62% 46%)`);
  /** 15 бітів → ліві 3 колонки, праві дзеркальні */
  const cells = $derived(
    Array.from({ length: 15 }, (_, i) => ({ on: Boolean((bits >> i) & 1), x: Math.floor(i / 5), y: i % 5 }))
      .filter((cell) => cell.on)
      .flatMap((cell) => (cell.x === 2 ? [cell] : [cell, { ...cell, x: 4 - cell.x }])),
  );
</script>

{#if src}
  <img class="ui-avatar" {src} alt="" width={size} height={size} />
{:else}
  <svg class="ui-avatar" viewBox="0 0 5 5" width={size} height={size} aria-hidden="true">
    <rect width="5" height="5" fill="var(--ui-surface-muted)" />
    {#each cells as cell (`${cell.x}-${cell.y}`)}
      <rect x={cell.x} y={cell.y} width="1" height="1" fill={color} />
    {/each}
  </svg>
{/if}

<style>
  .ui-avatar {
    flex: none;
    border: 1px solid var(--ui-border);
    border-radius: 6px;
    shape-rendering: crispEdges;
  }

  img.ui-avatar {
    object-fit: cover;
    background: var(--ui-surface-muted);
  }
</style>
