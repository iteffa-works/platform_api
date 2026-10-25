<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import AccountsPanel from '$lib/features/accounts/components/AccountsPanel.svelte';
  import { ensureAuth } from '$lib/features/auth';
  import CabinetHeader from '$lib/features/checks/components/CabinetHeader.svelte';
  import CheckResults from '$lib/features/checks/components/CheckResults.svelte';
  import ChecksQueue from '$lib/features/checks/components/ChecksQueue.svelte';
  import NewCheckPanel from '$lib/features/checks/components/NewCheckPanel.svelte';
  import { loadCabinet } from '$lib/features/checks';

  let ready = $state(false);

  onMount(async () => {
    if (!(await ensureAuth())) {
      goto('/login');
      return;
    }
    try {
      await loadCabinet();
      ready = true;
    } catch {
      goto('/login');
    }
  });
</script>

{#if !ready}
  <p class="muted">Завантаження…</p>
{:else}
  <CabinetHeader />
  <AccountsPanel />
  <NewCheckPanel />
  <ChecksQueue />
  <CheckResults />
{/if}
