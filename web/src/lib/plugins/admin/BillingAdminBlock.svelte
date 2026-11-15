<script lang="ts">
  /** Білінг: поповнення балансу, тарифи, журнал операцій усіх користувачів */
  import { onMount } from 'svelte';
  import { can, user } from '$lib/domain/auth';
  import { useI18n } from '$lib/i18n';
  import { errorMessage, formatDateTime, formatMoney } from '$lib/shared/utils';
  import { DataTable, EmptyState, ErrorText, Field, Panel } from '$lib/ui/components';
  import { Badge, Button, Text } from '$lib/ui/elements';
  import * as adminApi from './api.js';
  import type { BalanceTransaction, Plan } from './api.js';

  const { t, tx } = useI18n();

  let currency = $state('UAH');
  let plans = $state<Plan[]>([]);
  let transactions = $state<BalanceTransaction[]>([]);
  let error = $state('');
  let notice = $state('');
  let busy = $state(false);

  let email = $state('');
  let amount = $state('');
  let note = $state('');

  let planSlug = $state('');
  let planName = $state('');
  let planPrice = $state('');
  let planDescription = $state('');

  const canManage = $derived(can($user, 'billing', 'manage'));
  const TONE = { topup: 'green', charge: 'orange', adjustment: 'slate', refund: 'green' } as const;

  async function load() {
    const data = await adminApi.fetchBillingAdmin();
    currency = data.currency;
    plans = data.plans;
    transactions = data.transactions;
  }

  async function run(action: () => Promise<string | void>) {
    busy = true;
    error = '';
    notice = '';
    try {
      notice = (await action()) ?? '';
      await load();
    } catch (err) {
      error = errorMessage(err);
    } finally {
      busy = false;
    }
  }

  function adjust(event: Event) {
    event.preventDefault();
    void run(async () => {
      await adminApi.adjustBalance(email, amount, note);
      email = '';
      amount = '';
      note = '';
      return $t('billing.adjusted');
    });
  }

  function addPlan(event: Event) {
    event.preventDefault();
    void run(async () => {
      await adminApi.createPlan({ slug: planSlug, name: planName, price: planPrice || '0', description: planDescription });
      planSlug = '';
      planName = '';
      planPrice = '';
      planDescription = '';
    });
  }

  const toggle = (plan: Plan) => run(() => adminApi.updatePlan(plan.id, { isActive: !plan.isActive }).then(() => undefined));

  const remove = (plan: Plan) => {
    if (!confirm($t('billing.deletePlanConfirm', { plan: plan.name }))) return;
    void run(() => adminApi.deletePlan(plan.id).then(() => undefined));
  };

  onMount(() => {
    load().catch((err) => (error = errorMessage(err)));
  });
</script>

{#if canManage}
  <Panel title={$t('billing.adjustTitle')}>
    <form class="row" onsubmit={adjust}>
      <Field label={$t('auth.email')} type="email" bind:value={email} required grow />
      <Field label={$t('billing.amountSigned')} bind:value={amount} inputmode="decimal" required />
      <Field label={$t('billing.note')} bind:value={note} grow />
      <Button type="submit" disabled={busy}>{$t('common.apply')}</Button>
    </form>
    <Text tone="muted">{$t('billing.adjustHint')}</Text>
  </Panel>
{/if}

<ErrorText message={error} />
{#if notice}<p class="notice">{notice}</p>{/if}

<Panel title="{$t('billing.plans')} · {plans.length}" flush>
  <DataTable>
    {#snippet head()}
      <tr><th>{$t('billing.plan')}</th><th>{$t('billing.price')}</th><th>{$t('billing.status')}</th><th></th></tr>
    {/snippet}
    {#snippet body()}
      {#each plans as plan (plan.id)}
        <tr>
          <td><strong>{plan.name}</strong> <small class="muted">{plan.slug}</small>{#if plan.description}<br /><small class="muted">{plan.description}</small>{/if}</td>
          <td>{Number(plan.price) ? $formatMoney(plan.price, currency) : $t('billing.free')}</td>
          <td>
            {#if plan.isDefault}<Badge tone="blue">{$t('billing.default')}</Badge>{/if}
            <Badge tone={plan.isActive ? 'green' : 'slate'}>{plan.isActive ? $t('billing.active') : $t('billing.inactive')}</Badge>
          </td>
          <td class="actions">
            {#if canManage && !plan.isDefault}
              <Button variant="ghost" disabled={busy} onclick={() => toggle(plan)}>
                {plan.isActive ? $t('billing.deactivate') : $t('billing.activate')}
              </Button>
              <Button variant="ghost" disabled={busy} onclick={() => remove(plan)}>{$t('common.delete')}</Button>
            {/if}
          </td>
        </tr>
      {/each}
    {/snippet}
  </DataTable>
  {#if canManage}
    <form class="row new" onsubmit={addPlan}>
      <Field label={$t('roles.name')} bind:value={planName} required grow />
      <Field label={$t('billing.planSlug')} bind:value={planSlug} required />
      <Field label={$t('billing.price')} bind:value={planPrice} inputmode="decimal" />
      <Field label={$t('billing.description')} bind:value={planDescription} grow />
      <Button type="submit" disabled={busy}>{$t('common.create')}</Button>
    </form>
  {/if}
</Panel>

<Panel title={$t('billing.allTransactions')} flush>
  {#if transactions.length === 0}
    <div class="empty"><EmptyState text={$t('billing.noTransactions')} /></div>
  {:else}
    <DataTable>
      {#snippet head()}
        <tr><th>{$t('common.date')}</th><th>{$t('users.user')}</th><th>{$t('billing.operation')}</th><th>{$t('billing.amount')}</th><th>{$t('billing.after')}</th></tr>
      {/snippet}
      {#snippet body()}
        {#each transactions as row (row.id)}
          <tr>
            <td class="muted">{$formatDateTime(row.createdAt)}</td>
            <td>{row.user?.email ?? '—'}</td>
            <td><Badge tone={TONE[row.kind]}>{$tx(`billing.kind.${row.kind}`, row.kind)}</Badge> {row.note ?? ''}</td>
            <td>{Number(row.amount) > 0 ? '+' : ''}{$formatMoney(row.amount, currency)}</td>
            <td>{$formatMoney(row.balanceAfter, currency)}</td>
          </tr>
        {/each}
      {/snippet}
    </DataTable>
  {/if}
</Panel>

<style>
  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 12px;
  }

  .new {
    padding: 16px;
    border-top: 1px solid var(--ui-border);
  }

  .actions {
    text-align: right;
    white-space: nowrap;
  }

  .muted {
    color: var(--ui-muted);
  }

  .notice {
    margin: 0;
    color: var(--ui-success);
    font-weight: 600;
  }

  .empty {
    padding: 16px;
  }
</style>
