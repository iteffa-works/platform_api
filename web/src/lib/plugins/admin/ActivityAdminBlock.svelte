<script lang="ts">
  /** Журнал дій усіх користувачів; фільтр за користувачем */
  import { onMount } from 'svelte';
  import { useI18n } from '$lib/i18n';
  import { describeAgent, errorMessage, formatDateTime } from '$lib/shared/utils';
  import { DataTable, EmptyState, ErrorText, Panel } from '$lib/ui/components';
  import { fetchActivity, type ActivityEntry } from './api.js';

  const { t, tx } = useI18n();

  let entries = $state<ActivityEntry[]>([]);
  let filter = $state('');
  let error = $state('');

  const visible = $derived(
    filter.trim() ? entries.filter((entry) => entry.user?.email.includes(filter.trim().toLowerCase())) : entries,
  );

  onMount(() => {
    fetchActivity().then((data) => (entries = data.entries)).catch((err) => (error = errorMessage(err)));
  });
</script>

<Panel title="{$t('nav.activityAdmin')} · {visible.length}" flush>
  <div class="filter">
    <input type="search" placeholder={$t('activity.filter')} bind:value={filter} aria-label={$t('activity.filter')} />
  </div>
  {#if visible.length === 0}
    <div class="empty"><EmptyState text={$t('activity.empty')} /></div>
  {:else}
    <DataTable>
      {#snippet head()}
        <tr><th>{$t('common.date')}</th><th>{$t('users.user')}</th><th>{$t('activity.action')}</th><th>IP</th><th>{$t('security.device')}</th></tr>
      {/snippet}
      {#snippet body()}
        {#each visible as entry (entry.id)}
          <tr>
            <td class="muted">{$formatDateTime(entry.createdAt)}</td>
            <td>{entry.user?.email ?? '—'}</td>
            <td>{$tx(`activity.${entry.action}`, entry.action, entry.meta ?? undefined)}</td>
            <td class="muted">{entry.ip ?? '—'}</td>
            <td class="muted">{describeAgent(entry.userAgent)}</td>
          </tr>
        {/each}
      {/snippet}
    </DataTable>
  {/if}
</Panel>
<ErrorText message={error} />

<style>
  .filter {
    padding: 12px 16px;
    border-bottom: 1px solid var(--ui-border);
  }

  .filter input {
    width: min(320px, 100%);
    height: 34px;
    padding: 0 10px;
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius);
    background: var(--ui-surface);
  }

  .muted {
    color: var(--ui-muted);
    white-space: nowrap;
  }

  .empty {
    padding: 16px;
  }
</style>
