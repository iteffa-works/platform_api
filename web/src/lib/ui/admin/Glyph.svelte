<script lang="ts" module>
  /**
   * Службові іконки робочого простору (стрілки, меню, фільтр…), стиль як у Icon (24×24, stroke).
   * Тимчасово окремо від Icon.svelte — злити в один набір разом з власником Icon.
   */
  export const GLYPHS = {
    'chevron-down': 'M6 9l6 6 6-6',
    'chevron-left': 'M15 18l-6-6 6-6',
    'chevron-right': 'M9 18l6-6-6-6',
    'chevrons-left': 'M11 17l-5-5 5-5M18 17l-5-5 5-5',
    'chevrons-right': 'M13 17l5-5-5-5M6 17l5-5-5-5',
    menu: 'M3 6h18M3 12h18M3 18h18',
    close: 'M18 6 6 18M6 6l12 12',
    filter: 'M22 3H2l8 9.46V19l4 2v-8.54z',
    more: 'M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM19 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM5 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
    help: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01',
    info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01',
    alert: 'M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01',
    sidebar: 'M3 3h18v18H3zM9 3v18',
    external: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3',
    refresh: 'M23 4v6h-6M1 20v-6h6M3.5 9a9 9 0 0 1 14.9-3.4L23 10M1 14l4.6 4.4A9 9 0 0 0 20.5 15',
    send: 'M22 2 11 13M22 2l-7 20-4-9-9-4z',
    file: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5',
    edit: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z',
  } as const;

  export type GlyphName = keyof typeof GLYPHS;
</script>

<script lang="ts">
  let { name, size = 16 }: { name: GlyphName; size?: number } = $props();
</script>

<svg class="glyph" viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
  <path d={GLYPHS[name]} />
</svg>

<style>
  .glyph {
    flex: none;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
</style>
