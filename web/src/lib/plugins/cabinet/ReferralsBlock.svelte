<script lang="ts">
  /** Реферали: посилання-запрошення і список запрошених */
  import { onMount } from 'svelte';
  import { APP_ORIGIN } from '$lib/config';
  import { useI18n } from '$lib/i18n';
  import { errorMessage, formatDate } from '$lib/shared/utils';
  import { DataTable, EmptyState, ErrorText, Panel, StatCard } from '$lib/ui/components';
  import { Button, Icon, Text } from '$lib/ui/elements';
  import { fetchReferrals } from './api.js';

  const { t } = useI18n();

  let data = $state<Awaited<ReturnType<typeof fetchReferrals>> | null>(null);
  let error = $state('');
  let copied = $state(false);

  const link = $derived(data ? `${APP_ORIGIN}/register?ref=${data.code}` : '');

  async function copy() {
    await navigator.clipboard.writeText(link);
    copied = true;
  }

  onMount(() => {
    fetchReferrals().then((value) => (data = value)).catch((err) => (error = errorMessage(err)));
  });
</script>

{#if data}
  <div class="stats">
    <StatCard label={$t('referrals.invited')} value={data.invited.length} note={$t('referrals.invitedNote')} icon="users" accent="purple" />
    <StatCard label={$t('referrals.code')} value={data.code} note={$t('referrals.codeNote')} icon="gift" accent="blue" />
  </div>

  <Panel title={$t('referrals.link')}>
    <div class="link">
      <span class="link__prefix">{APP_ORIGIN}/register?ref=</span>
      <input readonly value={data.code} aria-label={$t('referrals.link')} />
      <Button variant="ghost" onclick={copy}><Icon name="copy" />{copied ? $t('common.copied') : $t('common.copy')}</Button>
    </div>
    <Text tone="muted">{$t('referrals.hint')}</Text>
  </Panel>

  <Panel title={$t('referrals.list')} flush>
    {#if data.invited.length === 0}
      <div class="empty"><EmptyState text={$t('referrals.empty')} /></div>
    {:else}
      <DataTable>
        {#snippet head()}
          <tr><th>{$t('auth.email')}</th><th>{$t('common.registered')}</th></tr>
        {/snippet}
        {#snippet body()}
          {#each data!.invited as row (row.id)}
            <tr><td>{row.email}</td><td class="muted">{$formatDate(row.createdAt)}</td></tr>
          {/each}
        {/snippet}
      </DataTable>
    {/if}
  </Panel>
{/if}
<ErrorText message={error} />

<style>
  .stats {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }

  .link {
    display: flex;
    align-items: stretch;
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius);
    overflow: hidden;
  }

  .link__prefix {
    display: flex;
    align-items: center;
    padding: 0 10px;
    border-right: 1px solid var(--ui-border);
    background: var(--ui-surface-muted);
    color: var(--ui-muted);
    font-size: 13px;
    white-space: nowrap;
  }

  .link input {
    flex: 1;
    min-width: 0;
    height: var(--ui-control-h);
    padding: 0 12px;
    border: 0;
    background: var(--ui-surface);
  }

  .link :global(.ui-btn) {
    border-width: 0 0 0 1px;
    border-radius: 0;
  }

  .muted {
    color: var(--ui-muted);
  }

  .empty {
    padding: 16px;
  }

  @media (max-width: 760px) {
    .stats {
      grid-template-columns: 1fr;
    }

    .link__prefix {
      display: none;
    }
  }
</style>
