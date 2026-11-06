<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import AccountsPanel from '$lib/features/accounts/components/AccountsPanel.svelte';
  import { accountsError, loadAccounts } from '$lib/features/accounts';
  import { ensureAuth, user } from '$lib/features/auth';
  import Banner from '$lib/shared/ui/Banner.svelte';
  import ErrorText from '$lib/shared/ui/ErrorText.svelte';

  let ready = $state(false);

  onMount(async () => {
    if (!(await ensureAuth())) {
      goto('/login');
      return;
    }
    try {
      await loadAccounts();
      ready = true;
    } catch {
      goto('/login');
    }
  });
</script>

{#if !ready}
  <p class="muted">Завантаження…</p>
{:else}
  <section class="card stack">
    <div class="row">
      <div class="grow">
        <h1>Кабінет</h1>
        <p class="muted">{$user?.email || ''} · {$user?.role === 'admin' ? 'адміністратор' : 'користувач'}</p>
      </div>
      {#if $user?.role === 'admin'}
        <a class="btn ghost" href="/admin">Адмінка</a>
      {/if}
    </div>
    <Banner text="Керуйте акаунтами. Важка обробка виконується клієнтами через /api/client/v1." />
    <ErrorText message={$accountsError} />
  </section>
  <AccountsPanel />
{/if}
