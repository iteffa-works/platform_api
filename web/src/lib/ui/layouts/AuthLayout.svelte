<script lang="ts">
  /** Макет сторінок входу / реєстрації */
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();
</script>

<div class="ui-auth-layout">{@render children()}</div>

<style>
  .ui-auth-layout {
    width: 100%;
  }
</style>
