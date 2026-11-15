<script lang="ts">
  /** Огляд кабінету: роль, тариф і баланс, стаж, доступи за роллю */
  import { roleName, useI18n } from '$lib/i18n';
  import { formatDate, formatMoney } from '$lib/shared/utils';
  import { DataTable, EmptyState, Panel, StatCard } from '$lib/ui/components';
  import LevelCell from './LevelCell.svelte';
  import { billingSummary, profile } from './store.js';

  const { t, tx } = useI18n();

  const days = $derived(
    $profile ? Math.max(1, Math.ceil((Date.now() - new Date($profile.user.createdAt).getTime()) / 86_400_000)) : 0,
  );
</script>

{#if $profile}
  <div class="stats">
    <StatCard label={$t('overview.role')} value={roleName($tx, $profile.user.role)} note={$t('overview.roleNote')} icon="shield" accent="purple" />
    <StatCard
      label={$t('billing.plan')}
      value={$billingSummary?.plan?.name ?? '—'}
      note={$billingSummary ? $t('overview.balanceNote', { amount: $formatMoney($billingSummary.balance, $billingSummary.currency) }) : ''}
      icon="wallet"
      accent="blue"
    />
    <StatCard
      label={$t('overview.since')}
      value={$t('overview.days', { count: days })}
      note={$formatDate($profile.user.createdAt)}
      icon="calendar"
      accent="green"
    />
  </div>

  <Panel title={$t('overview.myAccess')} action={{ href: '/app/access', label: $t('common.viewAll') }} flush>
    {#if $profile.access.length === 0}
      <div class="empty"><EmptyState text={$t('access.empty')} /></div>
    {:else}
      <DataTable>
        {#snippet head()}
          <tr><th>{$t('access.section')}</th><th>{$t('access.level')}</th></tr>
        {/snippet}
        {#snippet body()}
          {#each $profile.access as item (item.key)}
            <tr>
              <td class="name">{$tx(`resource.${item.key}`, item.label)}</td>
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
