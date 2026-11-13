<script lang="ts">
  /** Доступи: роль і рівні прав по розділах платформи */
  import { DataTable, EmptyState, Panel, StatCard } from '$lib/ui/components';
  import LevelCell from './LevelCell.svelte';
  import { profile } from './store.js';

  const isDeveloper = $derived(Boolean($profile?.user.permissions['*']));
</script>

{#if $profile}
  <div class="stats">
    <StatCard label="Роль" value={$profile.user.role.name} note={isDeveloper ? 'усі права, зокрема в майбутніх модулях' : 'призначає адміністратор'} icon="shield" accent="purple" />
    <StatCard label="Доступні розділи" value={$profile.access.length} note="за рівнями прав ролі" icon="layers" accent="blue" />
  </div>

  <Panel title="Рівні прав" flush>
    {#if $profile.access.length === 0}
      <div class="empty"><EmptyState text="Додаткових доступів немає — лише власний кабінет." /></div>
    {:else}
      <DataTable>
        {#snippet head()}
          <tr><th>Розділ</th><th>Рівень</th></tr>
        {/snippet}
        {#snippet body()}
          {#each $profile.access as item (item.key)}
            <tr><td>{item.label}</td><td><LevelCell level={item.level} /></td></tr>
          {/each}
        {/snippet}
      </DataTable>
    {/if}
  </Panel>
{/if}

<style>
  .stats {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }

  .empty {
    padding: 16px;
  }

  @media (max-width: 760px) {
    .stats {
      grid-template-columns: 1fr;
    }
  }
</style>
