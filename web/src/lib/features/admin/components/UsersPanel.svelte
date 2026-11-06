<script lang="ts">
  import { adminBusy, adminUsers, changeUserRole } from '$lib/features/admin/store';
  import { user } from '$lib/features/auth';
</script>

<section class="card stack">
  <h2>Користувачі</h2>
  {#if $adminUsers.length === 0}
    <p class="muted">Користувачів немає.</p>
  {:else}
    <table>
      <thead>
        <tr><th>Email</th><th>Роль</th><th></th></tr>
      </thead>
      <tbody>
        {#each $adminUsers as row (row.id)}
          <tr>
            <td>{row.email}{row.id === $user?.id ? ' · ви' : ''}</td>
            <td>{row.role}</td>
            <td class="row">
              {#if row.role !== 'admin'}
                <button class="ghost" type="button" disabled={$adminBusy} onclick={() => changeUserRole(row.id, 'admin')}>Зробити admin</button>
              {:else}
                <button class="ghost" type="button" disabled={$adminBusy || row.id === $user?.id} onclick={() => changeUserRole(row.id, 'user')}>Зробити user</button>
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</section>
