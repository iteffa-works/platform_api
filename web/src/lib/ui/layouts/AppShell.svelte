<script lang="ts">
  /** Оболонка сайту: topbar + контент */
  import type { Snippet } from 'svelte';
  import Topbar from './Topbar.svelte';

  let { children }: { children: Snippet } = $props();
</script>

<div class="ui-shell">
  <Topbar />
  <main class="ui-shell__page">{@render children()}</main>
</div>

<style>
  .ui-shell {
    width: var(--ui-shell);
    margin: 0 auto;
    padding: 24px 0 64px;
  }

  .ui-shell__page {
    display: grid;
    gap: var(--ui-gap-lg);
  }
</style>
