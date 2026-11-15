<script lang="ts">
  /** Журнал дій акаунта: що, коли, звідки */
  import { onMount } from 'svelte';
  import { useI18n } from '$lib/i18n';
  import { describeAgent, errorMessage, formatDateTime } from '$lib/shared/utils';
  import { DataTable, EmptyState, ErrorText, Panel } from '$lib/ui/components';
  import { fetchActivity, type ActivityEntry } from './api.js';

  const { t, tx } = useI18n();

  let entries = $state<ActivityEntry[] | null>(null);
  let error = $state('');

  onMount(() => {
    fetchActivity().then((data) => (entries = data.entries)).catch((err) => (error = errorMessage(err)));
  });
</script>

<Panel title={$t('activity.title')} flush>
  {#if entries && entries.length === 0}
    <div class="empty"><EmptyState text={$t('activity.empty')} /></div>
  {:else if entries}
    <DataTable>
      {#snippet head()}
        <tr><th>{$t('common.date')}</th><th>{$t('activity.action')}</th><th>IP</th><th>{$t('security.device')}</th></tr>
      {/snippet}
      {#snippet body()}
        {#each entries! as entry (entry.id)}
          <tr>
            <td class="muted">{$formatDateTime(entry.createdAt)}</td>
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
  .muted {
    color: var(--ui-muted);
    white-space: nowrap;
  }

  .empty {
    padding: 16px;
  }
</style>
