<script lang="ts">
  /** Користувачі: аватар, роль (призначення), дата реєстрації */
  import { can, DEVELOPER_ROLE, user } from '$lib/domain/auth';
  import type { AdminUser } from '$lib/shared/types';
  import { roleName, useI18n } from '$lib/i18n';
  import { formatDate } from '$lib/shared/utils';
  import { DataTable, EmptyState, Panel } from '$lib/ui/components';
  import { Avatar, Badge } from '$lib/ui/elements';
  import { adminBusy, adminRoles, adminUsers, changeUserRole } from './store.js';

  /** Роль розробника не призначається з адмінки */
  const assignable = $derived($adminRoles.filter((role) => role.slug !== DEVELOPER_ROLE));
  const canManage = $derived(can($user, 'users', 'manage'));
  const { t, tx } = useI18n();

  function locked(row: AdminUser): boolean {
    return !canManage || row.id === $user?.id || row.role.slug === DEVELOPER_ROLE;
  }

  function onChange(row: AdminUser, event: Event) {
    const roleId = Number((event.currentTarget as HTMLSelectElement).value);
    if (roleId !== row.role.id) void changeUserRole(row.id, roleId);
  }
</script>

<Panel title="{$t('users.all')} · {$adminUsers.length}" flush>
  {#if $adminUsers.length === 0}
    <div class="empty"><EmptyState text={$t('users.empty')} /></div>
  {:else}
    <DataTable>
      {#snippet head()}
        <tr><th>{$t('users.user')}</th><th>ID</th><th>{$t('overview.role')}</th><th>{$t('common.registered')}</th></tr>
      {/snippet}
      {#snippet body()}
        {#each $adminUsers as row (row.id)}
          <tr>
            <td>
              <span class="person">
                <Avatar seed={row.email} src={row.avatarUrl} />
                <span>{row.email}{#if row.id === $user?.id}<small> · {$t('users.you')}</small>{/if}</span>
              </span>
            </td>
            <td class="muted">{row.id}</td>
            <td>
              {#if locked(row)}
                <Badge tone={row.role.slug === DEVELOPER_ROLE ? 'green' : 'blue'}>{roleName($tx, row.role)}</Badge>
              {:else}
                <select
                  class="role-select"
                  value={row.role.id}
                  disabled={$adminBusy}
                  aria-label="{$t('overview.role')}: {row.email}"
                  onchange={(event) => onChange(row, event)}
                >
                  {#each assignable as role (role.id)}
                    <option value={role.id}>{roleName($tx, role)}</option>
                  {/each}
                </select>
              {/if}
            </td>
            <td class="muted">{$formatDate(row.createdAt)}</td>
          </tr>
        {/each}
      {/snippet}
    </DataTable>
  {/if}
</Panel>

<style>
  .person {
    display: inline-flex;
    align-items: center;
    gap: 10px;
  }

  .person small,
  .muted {
    color: var(--ui-muted);
  }

  .empty {
    padding: 16px;
  }

  .role-select {
    height: 32px;
    padding: 0 8px;
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius);
    background: var(--ui-surface);
  }
</style>
