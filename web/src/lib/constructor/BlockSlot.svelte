<script lang="ts">
  /** Рендер списку блоків зі слота */
  import { getBlock } from './registry.js';
  import type { BlockRef } from './types.js';

  let { items = [] }: { items?: BlockRef[] } = $props();
</script>

{#each items as item (item.block + JSON.stringify(item.props ?? {}))}
  {@const Cmp = getBlock(item.block)}
  <Cmp {...(item.props ?? {})} />
{/each}
