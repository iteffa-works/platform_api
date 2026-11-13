<script lang="ts">
  /** Огляд кабінету: показники акаунта й доступи за роллю */
  import { formatDate } from '$lib/shared/utils';
  import { DataTable, EmptyState, Panel, StatCard } from '$lib/ui/components';
  import LevelCell from './LevelCell.svelte';
  import { profile } from './store.js';

  const days = $derived(
    $profile ? Math.max(1, Math.ceil((Date.now() - new Date($profile.user.createdAt).getTime()) / 86_400_000)) : 0,
  );
</script>

{#if $profile}
  <div class="stats">
    <StatCard label="Роль" value={$profile.user.role.name} note="визначає доступи" icon="shield" accent="purple" />
    <StatCard label="Доступні розділи" value={$profile.access.length} note="за рівнями прав" icon="layers" accent="blue" />
    <StatCard
      label="З нами"
      value="{days} дн."
      note="з {$formatDate($profile.user.createdAt)}"
      icon="calendar"
      accent="green"
    />
  </div>

  <Panel title="Мої доступи" action={{ href: '/app/access', label: 'Усі доступи' }} flush>
    {#if $profile.access.length === 0}
      <div class="empty"><EmptyState text="Додаткових доступів немає — лише власний кабінет." /></div>
    {:else}
      <DataTable>
        {#snippet head()}
          <tr><th>Розділ</th><th>Рівень</th></tr>
        {/snippet}
        {#snippet body()}
          {#each $profile.access as item (item.key)}
            <tr>
              <td class="name">{item.label}</td>
              <td><LevelCell level={item.level} /></td>
            </tr>
          {/each}
        {/snippet}
      </DataTable>
    {/if}
  </Panel>
{/if}

<style>
  .stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
  }

  .name {
    color: var(--ui-link);
    font-weight: 500;
  }

  .empty {
    padding: 16px;
  }

  @media (max-width: 860px) {
    .stats {
      grid-template-columns: 1fr;
    }
  }
</style>
