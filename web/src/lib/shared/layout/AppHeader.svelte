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
      <a href="/app" class:active={$page.url.pathname === '/app'}>Кабінет</a>
      {#if $user?.role === 'admin'}
        <a href="/admin" class:active={$page.url.pathname.startsWith('/admin')}>Адмінка</a>
      {/if}
      <button class="ghost" type="button" onclick={onLogout}>Вийти</button>
    {:else}
      <a href="/login" class:active={$page.url.pathname === '/login'}>Вхід</a>
      <a href="/register" class:active={$page.url.pathname === '/register'}>Реєстрація</a>
    {/if}
  </nav>
</header>
