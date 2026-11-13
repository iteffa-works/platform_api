<script lang="ts">
  /** Світла картка входу і реєстрації */
  import type { Snippet } from 'svelte';
  import { Brand } from '$lib/ui/elements';

  let { children }: { children: Snippet } = $props();
</script>

<main class="ui-auth">
  <section class="ui-auth-panel">
    <div class="ui-auth-panel__brand">
      <Brand href="/" image />
    </div>
    {@render children()}
  </section>
</main>

<style>
  .ui-auth {
    width: min(var(--ui-auth-width), calc(100% - 32px));
    margin: 0 auto;
    padding: 48px 0 64px;
  }

  .ui-auth-panel {
    display: grid;
    gap: 14px;
    width: 100%;
    padding: 20px 18px 18px;
    background: var(--ui-surface);
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius);
  }

  .ui-auth-panel__brand {
    line-height: 0;
  }
</style>
