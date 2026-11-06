<script lang="ts">
  /** CTA на головній залежно від сесії */
  import { isAuthenticated, user } from '$lib/domain/auth';
  import { Button } from '$lib/ui/elements';
</script>

{#if $isAuthenticated}
  <Button href="/app">Кабінет</Button>
  {#if $user?.role === 'admin'}
    <Button variant="ghost" href="/admin">Адмінка</Button>
  {/if}
{:else}
  <Button href="/login">Увійти</Button>
  <Button variant="ghost" href="/register">Реєстрація</Button>
{/if}
