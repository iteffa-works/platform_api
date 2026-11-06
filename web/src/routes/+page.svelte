<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { APP_ORIGIN } from '$lib/config';
  import { ensureAuth, isAuthenticated, user } from '$lib/features/auth';

  onMount(async () => {
    if (await ensureAuth()) goto('/app');
  });
</script>

<section class="card stack">
  <h1>Платформа</h1>
  <p class="lead">Кабінет і адмінка працюють через platform API `/api/v1`.</p>
  <p class="muted"><a href={APP_ORIGIN}>{APP_ORIGIN}</a></p>
  <div class="row">
    {#if $isAuthenticated}
      <a class="btn" href="/app">Кабінет</a>
      {#if $user?.role === 'admin'}
        <a class="btn ghost" href="/admin">Адмінка</a>
      {/if}
    {:else}
      <a class="btn" href="/login">Увійти</a>
      <a class="btn ghost" href="/register">Реєстрація</a>
    {/if}
  </div>
</section>
