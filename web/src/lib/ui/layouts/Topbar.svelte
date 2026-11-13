<script lang="ts">
  /** Верхня навігація внутрішніх сторінок (адмінка) */
  import { page } from '$app/stores';
  import { signOut, user } from '$lib/domain/auth';
  import { Brand, Button, Link, Text } from '$lib/ui/elements';
</script>

<header class="ui-topbar">
  <Brand />
  <nav class="ui-topbar__nav">
    <Text as="span" tone="muted">{$user?.email || ''}</Text>
    <Link href="/app" active={$page.url.pathname === '/app'}>Кабінет</Link>
    {#if $user?.role === 'admin'}
      <Link href="/admin" active={$page.url.pathname.startsWith('/admin')}>Адмінка</Link>
    {/if}
    <Button variant="ghost" onclick={signOut}>Вийти</Button>
  </nav>
</header>

<style>
  .ui-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .ui-topbar__nav {
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
  }

  @media (max-width: 640px) {
    .ui-topbar {
      align-items: flex-start;
      flex-direction: column;
    }
  }
</style>
