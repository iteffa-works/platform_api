<script lang="ts">
  /** Блок таблиці користувачів з призначенням ролі */
  import { adminBusy, adminRoles, adminUsers, changeUserRole } from './store.js';
  import { can, DEVELOPER_ROLE, user } from '$lib/domain/auth';
  import type { AdminUser } from '$lib/shared/types';
  import { Card, DataTable, EmptyState } from '$lib/ui/components';

  /** Роль розробника не призначається з адмінки */
  const assignable = $derived($adminRoles.filter((role) => role.slug !== DEVELOPER_ROLE));
  const canManage = $derived(can($user, 'users', 'manage'));

  function locked(row: AdminUser): boolean {
    return !canManage || row.id === $user?.id || row.role.slug === DEVELOPER_ROLE;
  }

  function onChange(row: AdminUser, event: Event) {
    const roleId = Number((event.currentTarget as HTMLSelectElement).value);
    if (roleId !== row.role.id) void changeUserRole(row.id, roleId);
  }
</script>

<Card>
  {#if $adminUsers.length === 0}
    <EmptyState text="Користувачів немає." />
  {:else}
    <DataTable>
      {#snippet head()}
        <tr><th>Email</th><th>Роль</th></tr>
      {/snippet}
      {#snippet body()}
        {#each $adminUsers as row (row.id)}
          <tr>
            <td>{row.email}{row.id === $user?.id ? ' · ви' : ''}</td>
            <td>
              {#if locked(row)}
                {row.role.name}
              {:else}
                <select
                  class="role-select"
                  value={row.role.id}
                  disabled={$adminBusy}
                  aria-label="Роль {row.email}"
                  onchange={(event) => onChange(row, event)}
                >
                  {#each assignable as role (role.id)}
                    <option value={role.id}>{role.name}</option>
                  {/each}
                </select>
              {/if}
            </td>
          </tr>
        {/each}
      {/snippet}
    </DataTable>
  {/if}
</Card>

<style>
  .role-select {
    height: 34px;
    padding: 0 8px;
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius);
    background: var(--ui-surface);
  }
</style>
