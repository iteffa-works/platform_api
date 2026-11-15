<script lang="ts">
  /** Тариф і баланс: поточний стан, вибір тарифу, історія операцій */
  import { onMount } from 'svelte';
  import { useI18n } from '$lib/i18n';
  import { errorMessage, formatDateTime, formatMoney } from '$lib/shared/utils';
  import { DataTable, EmptyState, ErrorText, Panel, StatCard } from '$lib/ui/components';
  import { Badge, Button, Text } from '$lib/ui/elements';
  import * as cabinetApi from './api.js';
  import type { BillingDetails } from './api.js';
  import { loadBillingSummary, loadNotifications } from './store.js';

  const { t, tx } = useI18n();

  let details = $state<BillingDetails | null>(null);
  let busy = $state(false);
  let error = $state('');

  async function load() {
    details = await cabinetApi.fetchBilling();
  }

  async function choose(planId: number, name: string) {
    if (!confirm($t('billing.switchConfirm', { plan: name }))) return;
    busy = true;
    error = '';
    try {
      await cabinetApi.choosePlan(planId);
      await Promise.all([load(), loadBillingSummary(), loadNotifications()]);
    } catch (err) {
      error = errorMessage(err);
    } finally {
      busy = false;
    }
  }

  onMount(() => {
    load().catch((err) => (error = errorMessage(err)));
  });

  const TONE = { topup: 'green', charge: 'orange', adjustment: 'slate' } as const;
</script>

{#if details}
  <div class="stats">
    <StatCard label={$t('billing.balance')} value={$formatMoney(details.balance, details.currency)} note={$t('billing.topupHint')} icon="wallet" accent="green" />
    <StatCard label={$t('billing.plan')} value={details.plan?.name ?? '—'} note={details.plan?.description ?? ''} icon="layers" accent="purple" />
  </div>

  <Panel title={$t('billing.plans')}>
    <div class="plans">
      {#each details.plans as plan (plan.id)}
        {@const current = plan.id === details.plan?.id}
        <article class="plan" class:is-current={current}>
          <h3>{plan.name}</h3>
          <p class="plan__price">
            {Number(plan.price) ? $formatMoney(plan.price, details.currency) : $t('billing.free')}
            {#if Number(plan.price)}<small>{$t('billing.perMonth')}</small>{/if}
          </p>
          {#if plan.description}<Text tone="muted">{plan.description}</Text>{/if}
          {#if current}
            <Badge tone="green">{$t('billing.current')}</Badge>
          {:else}
            <Button variant="ghost" disabled={busy} onclick={() => choose(plan.id, plan.name)}>{$t('billing.choose')}</Button>
          {/if}
        </article>
      {/each}
    </div>
    <Text tone="muted">{$t('billing.chargeHint')}</Text>
    <ErrorText message={error} />
  </Panel>

  <Panel title={$t('billing.history')} flush>
    {#if details.transactions.length === 0}
      <div class="empty"><EmptyState text={$t('billing.noTransactions')} /></div>
    {:else}
      <DataTable>
        {#snippet head()}
          <tr><th>{$t('common.date')}</th><th>{$t('billing.operation')}</th><th>{$t('billing.amount')}</th><th>{$t('billing.after')}</th></tr>
        {/snippet}
        {#snippet body()}
          {#each details!.transactions as row (row.id)}
            <tr>
              <td class="muted">{$formatDateTime(row.createdAt)}</td>
              <td><Badge tone={TONE[row.kind]}>{$tx(`billing.kind.${row.kind}`, row.kind)}</Badge> {row.note ?? ''}</td>
              <td class:plus={Number(row.amount) > 0}>{Number(row.amount) > 0 ? '+' : ''}{$formatMoney(row.amount, details!.currency)}</td>
              <td>{$formatMoney(row.balanceAfter, details!.currency)}</td>
            </tr>
          {/each}
        {/snippet}
      </DataTable>
    {/if}
  </Panel>
{:else}
  <ErrorText message={error} />
{/if}

<style>
  .stats {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }

  .plans {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 12px;
  }

  .plan {
    display: grid;
    align-content: start;
    justify-items: start;
    gap: 8px;
    padding: 16px;
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius);
  }

  .plan.is-current {
    border-color: var(--ui-tone-green);
  }

  .plan h3 {
    font-size: 16px;
  }

  .plan__price {
    margin: 0;
    font-size: 1.4rem;
    font-weight: 700;
  }

  .plan__price small {
    color: var(--ui-muted);
    font-size: 13px;
    font-weight: 400;
  }

  .muted {
    color: var(--ui-muted);
  }

  .plus {
    color: var(--ui-success);
    font-weight: 600;
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
