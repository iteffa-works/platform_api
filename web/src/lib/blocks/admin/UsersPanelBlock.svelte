<script lang="ts">
  /** Блок таблиці користувачів */
  import { adminBusy, adminUsers, changeUserRole } from '$lib/domain/admin';
  import { user } from '$lib/domain/auth';
  import { Button } from '$lib/ui/elements';
  import { Card, DataTable, EmptyState } from '$lib/ui/components';
  import { Row } from '$lib/ui/patterns';
</script>

<Card>
  <h2>Користувачі</h2>
  {#if $adminUsers.length === 0}
    <EmptyState text="Користувачів немає." />
  {:else}
    <DataTable>
      {#snippet head()}
        <tr><th>Email</th><th>Роль</th><th></th></tr>
      {/snippet}
      {#snippet body()}
        {#each $adminUsers as row (row.id)}
          <tr>
            <td>{row.email}{row.id === $user?.id ? ' · ви' : ''}</td>
            <td>{row.role}</td>
            <td>
              <Row>
                {#if row.role !== 'admin'}
                  <Button variant="ghost" disabled={$adminBusy} onclick={() => changeUserRole(row.id, 'admin')}>Зробити admin</Button>
                {:else}
                  <Button variant="ghost" disabled={$adminBusy || row.id === $user?.id} onclick={() => changeUserRole(row.id, 'user')}>Зробити user</Button>
                {/if}
              </Row>
            </td>
          </tr>
        {/each}
      {/snippet}
    </DataTable>
  {/if}
</Card>
