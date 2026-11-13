<script lang="ts">
  /** Світла картка входу і реєстрації */
  import type { Snippet } from 'svelte';
  import { Brand } from '$lib/ui/elements';
  import { AuthLayout } from '$lib/ui/layouts';

  let {
    title = '',
    children,
  }: {
    title?: string;
    children: Snippet;
  } = $props();
</script>

<AuthLayout>
  <section class="ui-auth-panel">
    <div class="ui-auth-panel__brand">
      <Brand href="/" image />
    </div>
    {#if title}
      <h1 class="ui-auth-panel__title">{title}</h1>
    {/if}
    {@render children()}
  </section>
</AuthLayout>

<style>
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

  .ui-auth-panel__title {
    margin: 0;
    color: var(--ui-text);
    font-size: 1.05rem;
    font-weight: 650;
  }
</style>
