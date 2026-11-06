<script lang="ts">
  /** Блок списку Telegram-акаунтів */
  import {
    accounts,
    accountsBusy,
    activateAccount,
    addAccount,
    removeAccount,
  } from '$lib/domain/accounts';
  import { Button } from '$lib/ui/elements';
  import { Card, DataTable, EmptyState, Field } from '$lib/ui/components';
  import { Row, Stack } from '$lib/ui/patterns';

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

<Card>
  <Stack>
    <h2>Telegram-акаунт</h2>
    <Row>
      <Field label="Назва" bind:value={label} grow />
      <Field label="api_id" bind:value={apiId} inputmode="numeric" />
      <Field label="api_hash" bind:value={apiHash} grow />
      <Button disabled={$accountsBusy} onclick={submit}>Додати</Button>
    </Row>

    {#if $accounts.length === 0}
      <EmptyState text="Акаунтів ще немає." />
    {:else}
      <DataTable>
        {#snippet head()}
          <tr><th>Назва</th><th>api_id</th><th></th></tr>
        {/snippet}
        {#snippet body()}
          {#each $accounts as account (account.id)}
            <tr>
              <td>{account.label}{account.isActive ? ' · активний' : ''}</td>
              <td>{account.apiId}</td>
              <td>
                <Row>
                  {#if !account.isActive}
                    <Button variant="ghost" disabled={$accountsBusy} onclick={() => activateAccount(account.id)}>Активувати</Button>
                  {/if}
                  <Button variant="ghost" disabled={$accountsBusy} onclick={() => removeAccount(account.id)}>Видалити</Button>
                </Row>
              </td>
            </tr>
          {/each}
        {/snippet}
      </DataTable>
    {/if}
  </Stack>
</Card>
