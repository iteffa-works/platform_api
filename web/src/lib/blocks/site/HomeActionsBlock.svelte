<script lang="ts">
  /** CTA на головній залежно від сесії */
  import { isAuthenticated } from '$lib/domain/auth';
  import { Button } from '$lib/ui/elements';
  import AdminLinkBlock from './AdminLinkBlock.svelte';
</script>

{#if $isAuthenticated}
  <Button href="/app">Кабінет</Button>
  <AdminLinkBlock />
{:else}
  <Button href="/login">Увійти</Button>
  <Button variant="ghost" href="/register">Реєстрація</Button>
{/if}
