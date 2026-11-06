<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import UsersPanel from '$lib/features/admin/components/UsersPanel.svelte';
  import { adminError, loadAdminUsers } from '$lib/features/admin';
  import { ensureAuth, user } from '$lib/features/auth';
  import ErrorText from '$lib/shared/ui/ErrorText.svelte';

  let ready = $state(false);

  onMount(async () => {
    if (!(await ensureAuth())) {
      goto('/login');
      return;
    }
    if ($user?.role !== 'admin') {
      goto('/app');
      return;
    }
    try {
      await loadAdminUsers();
      ready = true;
    } catch {
      goto('/app');
    }
  });
</script>

{#if !ready}
  <p class="muted">Завантаження…</p>
{:else}
  <section class="card stack">
    <div class="row">
      <div class="grow">
        <h1>Адмінка</h1>
        <p class="muted">Керування користувачами платформи</p>
      </div>
      <a class="btn ghost" href="/app">Кабінет</a>
    </div>
    <ErrorText message={$adminError} />
  </section>
  <UsersPanel />
{/if}
