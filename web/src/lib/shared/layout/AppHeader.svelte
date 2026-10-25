<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { APP_NAME } from '$lib/config';
  import { isAuthenticated, logout, user } from '$lib/features/auth';

  function onLogout() {
    logout();
    goto('/login');
  }
</script>

<header class="topbar">
  <a class="brand" href="/">{APP_NAME}</a>
  <nav class="nav">
    {#if $isAuthenticated}
      <span class="muted">{$user?.email || ''}</span>
      <a href="/app">Кабінет</a>
      <button class="ghost" type="button" onclick={onLogout}>Вийти</button>
    {:else}
      <a href="/login" class:active={$page.url.pathname === '/login'}>Вхід</a>
      <a href="/register" class:active={$page.url.pathname === '/register'}>Реєстрація</a>
      <a class="btn ghost" href="/app">Кабінет</a>
    {/if}
  </nav>
</header>
