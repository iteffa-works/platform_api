<script lang="ts">
  /**
   * Прапор країни смугами (емодзі-прапори Windows не показує).
   * Невідома країна — код у рамці.
   */
  let { code, size = 16, round = false }: { code: string | null; size?: number; round?: boolean } = $props();

  type Stripes = { dir: 'h' | 'v'; colors: string[] };

  const FLAGS: Record<string, Stripes> = {
    UA: { dir: 'h', colors: ['#0057b7', '#ffd700'] },
    DE: { dir: 'h', colors: ['#000000', '#dd0000', '#ffce00'] },
    NL: { dir: 'h', colors: ['#ae1c28', '#ffffff', '#21468b'] },
    PL: { dir: 'h', colors: ['#ffffff', '#dc143c'] },
    LT: { dir: 'h', colors: ['#fdb913', '#006a44', '#c1272d'] },
    LV: { dir: 'h', colors: ['#9e3039', '#ffffff', '#9e3039'] },
    EE: { dir: 'h', colors: ['#0072ce', '#000000', '#ffffff'] },
    AT: { dir: 'h', colors: ['#ed2939', '#ffffff', '#ed2939'] },
    HU: { dir: 'h', colors: ['#ce2939', '#ffffff', '#477050'] },
    BG: { dir: 'h', colors: ['#ffffff', '#00966e', '#d62612'] },
    RU: { dir: 'h', colors: ['#ffffff', '#0039a6', '#d52b1e'] },
    FR: { dir: 'v', colors: ['#002395', '#ffffff', '#ed2939'] },
    IT: { dir: 'v', colors: ['#009246', '#ffffff', '#ce2b37'] },
    RO: { dir: 'v', colors: ['#002b7f', '#fcd116', '#ce1126'] },
    IE: { dir: 'v', colors: ['#169b62', '#ffffff', '#ff883e'] },
    BE: { dir: 'v', colors: ['#000000', '#fae042', '#ed2939'] },
  };

  const flag = $derived(code ? FLAGS[code.toUpperCase()] : undefined);
  const height = $derived(round ? size : Math.round(size * 0.7));
  const gradient = $derived(flag
    ? `linear-gradient(${flag.dir === 'h' ? '180deg' : '90deg'}, ${flag.colors
      .map((color, index) => `${color} ${(index / flag.colors.length) * 100}% ${((index + 1) / flag.colors.length) * 100}%`)
      .join(', ')})`
    : '');
</script>

{#if flag}
  <span class="flag" class:is-round={round} style:width="{size}px" style:height="{height}px" style:background={gradient} aria-hidden="true"></span>
{:else if code}
  <span class="code" aria-hidden="true">{code}</span>
{/if}

<style>
  .flag {
    display: inline-block;
    flex: none;
    border-radius: 2px;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.12);
    vertical-align: -2px;
  }

  .flag.is-round {
    border-radius: 50%;
    box-shadow: 0 0 0 3px var(--ui-surface), 0 1px 4px rgba(0, 0, 0, 0.2);
  }

  .code {
    padding: 0 4px;
    border: 1px solid var(--ui-border);
    border-radius: 4px;
    font-size: 11px;
    font-weight: 700;
  }
</style>
