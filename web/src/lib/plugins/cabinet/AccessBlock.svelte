<script lang="ts">
  /** Доступи: роль і рівні прав по розділах платформи */
  import { roleName, useI18n } from '$lib/i18n';
  import { DataTable, EmptyState, Panel, StatCard } from '$lib/ui/components';
  import LevelCell from './LevelCell.svelte';
  import { profile } from './store.js';

  const { t, tx } = useI18n();
  const isDeveloper = $derived(Boolean($profile?.user.permissions['*']));
</script>

{#if $profile}
  <div class="stats">
    <StatCard
      label={$t('overview.role')}
      value={roleName($tx, $profile.user.role)}
      note={isDeveloper ? $t('access.developerNote') : $t('access.roleNote')}
      icon="shield"
      accent="purple"
    />
    <StatCard label={$t('access.sections')} value={$profile.access.length} note={$t('access.sectionsNote')} icon="layers" accent="blue" />
  </div>

  <Panel title={$t('access.levels')} flush>
    {#if $profile.access.length === 0}
      <div class="empty"><EmptyState text={$t('access.empty')} /></div>
    {:else}
      <DataTable>
        {#snippet head()}
          <tr><th>{$t('access.section')}</th><th>{$t('access.level')}</th></tr>
        {/snippet}
        {#snippet body()}
          {#each $profile.access as item (item.key)}
            <tr><td>{$tx(`resource.${item.key}`, item.label)}</td><td><LevelCell level={item.level} /></td></tr>
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
