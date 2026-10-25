<script lang="ts">
  import { accounts, selectedAccountId } from '$lib/features/accounts';
  import { checksBusy, startCheck } from '$lib/features/checks/store';

  let queries = $state('');

  function submit() {
    startCheck($selectedAccountId, queries).then(() => {
      queries = '';
    });
  }
</script>

<section class="card stack">
  <h2>Нова перевірка</h2>
  <label>
    Акаунт
    <select bind:value={$selectedAccountId}>
      {#each $accounts as account (account.id)}
        <option value={account.id}>{account.label}</option>
      {/each}
    </select>
  </label>
  <label>
    Контакти (телефон або @username)
    <textarea bind:value={queries} placeholder={'+380501112233\n@username'}></textarea>
  </label>
  <div class="row">
    <button type="button" disabled={$checksBusy || $accounts.length === 0} onclick={submit}>У чергу</button>
  </div>
</section>
