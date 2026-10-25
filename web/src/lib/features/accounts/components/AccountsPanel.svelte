<script lang="ts">
  import {
    accounts,
    accountsBusy,
    activateAccount,
    addAccount,
    removeAccount,
  } from '$lib/features/accounts/store';

  let label = $state('');
  let apiId = $state('');
  let apiHash = $state('');

  function submit() {
    addAccount(label, Number(apiId), apiHash).then(() => {
      label = '';
      apiId = '';
      apiHash = '';
    });
  }
</script>

<section class="card stack">
  <h2>Telegram-акаунт</h2>
  <div class="row">
    <label class="grow">Назва <input bind:value={label} /></label>
    <label>api_id <input bind:value={apiId} inputmode="numeric" /></label>
    <label class="grow">api_hash <input bind:value={apiHash} /></label>
    <button type="button" disabled={$accountsBusy} onclick={submit}>Додати</button>
  </div>
  {#if $accounts.length === 0}
    <p class="muted">Акаунтів ще немає.</p>
  {:else}
    <table>
      <thead>
        <tr><th>Назва</th><th>api_id</th><th></th></tr>
      </thead>
      <tbody>
        {#each $accounts as account (account.id)}
          <tr>
            <td>{account.label}{account.isActive ? ' · активний' : ''}</td>
            <td>{account.apiId}</td>
            <td class="row">
              {#if !account.isActive}
                <button class="ghost" type="button" disabled={$accountsBusy} onclick={() => activateAccount(account.id)}>Активувати</button>
              {/if}
              <button class="ghost" type="button" disabled={$accountsBusy} onclick={() => removeAccount(account.id)}>Видалити</button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</section>
