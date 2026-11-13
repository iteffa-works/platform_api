<script lang="ts">
  /** CTA залежно від сесії: компактні (шапка) або великі (hero, фінальний блок) */
  import { isAuthenticated } from '$lib/domain/auth';
  import { Button } from '$lib/ui/elements';
  import AdminLinkBlock from './AdminLinkBlock.svelte';

  let { size = 'md' }: { size?: 'md' | 'lg' } = $props();
</script>

{#if $isAuthenticated}
  <Button {size} href="/app">Відкрити кабінет</Button>
  {#if size === 'md'}<AdminLinkBlock />{/if}
{:else}
  <Button {size} variant="ghost" href="/login">Увійти</Button>
  <Button {size} href="/register">Створити акаунт</Button>
{/if}
