<script lang="ts">
  /**
   * Баланс: поповнення заявкою (на картку / банківський переказ) з реквізитами й призначенням платежу,
   * мої заявки, історія операцій. Кошти зараховує адміністратор, побачивши переказ.
   */
  import { askConfirm } from '$lib/ui/dialog/ask';
  import { onMount } from 'svelte';
  import { useI18n } from '$lib/i18n';
  import { errorMessage, formatDateTime, formatMoney } from '$lib/shared/utils';
  import { DataTable, EmptyState, ErrorText, Panel, StatCard } from '$lib/ui/components';
  import { Badge, Button, Icon, Text } from '$lib/ui/elements';
  import * as cabinetApi from './api.js';
  import type { BillingDetails, Topup, TopupMethod } from './api.js';
  import { loadBillingSummary } from './store.js';

  const { t, tx } = useI18n();

  let details = $state<BillingDetails | null>(null);
  let method = $state<TopupMethod | null>(null);
  let amount = $state('');
  let busy = $state(false);
  let error = $state('');
  let copied = $state('');

  async function load() {
    details = await cabinetApi.fetchBilling();
    if (!method || !details.methods.some((item) => item.method === method)) method = details.methods[0]?.method ?? null;
  }

  onMount(() => {
    load().catch((err) => (error = errorMessage(err)));
  });

  const QUICK = [100, 300, 500, 1000];

  async function request(event: Event) {
    event.preventDefault();
    if (!method) return;
    busy = true;
    error = '';
    try {
      await cabinetApi.createTopup(method, amount.replace(',', '.'));
      amount = '';
      await Promise.all([load(), loadBillingSummary()]);
    } catch (err) {
      error = errorMessage(err);
    } finally {
      busy = false;
    }
  }

  async function cancel(topup: Topup) {
    if (!(await askConfirm($t('billing.topup.cancelConfirm', { reference: topup.reference }), { tone: 'danger' }))) return;
    busy = true;
    try {
      await cabinetApi.cancelTopup(topup.id);
      await Promise.all([load(), loadBillingSummary()]);
    } catch (err) {
      error = errorMessage(err);
    } finally {
      busy = false;
    }
  }

  async function copy(value: string) {
    await navigator.clipboard.writeText(value.replace(/\s/g, ''));
    copied = value;
    setTimeout(() => (copied = copied === value ? '' : copied), 1500);
  }

  /** Поля реквізитів у порядку показу */
  const FIELDS: Record<TopupMethod, string[]> = {
    card: ['number', 'holder', 'bank'],
    bank: ['recipient', 'iban', 'edrpou', 'bank'],
  };
  const COPYABLE = new Set(['number', 'iban', 'edrpou']);

  const pending = $derived(details?.topups.filter((item) => item.status === 'pending') ?? []);
  const KIND_TONE = { topup: 'green', charge: 'orange', adjustment: 'slate', refund: 'green' } as const;
  const STATUS_TONE = { pending: 'orange', paid: 'green', cancelled: 'slate' } as const;
</script>

{#snippet requisites(topup: Topup)}
  <dl class="req">
    {#each FIELDS[topup.method] as key (key)}
      {#if topup.requisites?.[key]}
        <div>
          <dt>{$t(`billing.req.${key}` as 'billing.req.number')}</dt>
          <dd>
            <span class:mono={COPYABLE.has(key)}>{topup.requisites[key]}</span>
            {#if COPYABLE.has(key)}
              <button type="button" class="copy" onclick={() => copy(topup.requisites![key]!)} title={$t('common.copy')}>
                <Icon name={copied === topup.requisites[key] ? 'check' : 'copy'} size={14} />
              </button>
            {/if}
          </dd>
        </div>
      {/if}
    {/each}
    <div>
      <dt>{$t('billing.req.amount')}</dt>
      <dd><b>{$formatMoney(topup.amount, details!.currency)}</b></dd>
    </div>
    <div class="is-key">
      <dt>{$t('billing.req.reference')}</dt>
      <dd>
        <span class="mono">{topup.reference}</span>
        <button type="button" class="copy" onclick={() => copy(topup.reference)} title={$t('common.copy')}>
          <Icon name={copied === topup.reference ? 'check' : 'copy'} size={14} />
        </button>
      </dd>
    </div>
  </dl>
{/snippet}

{#if details}
  <div class="stats">
    <StatCard label={$t('billing.balance')} value={$formatMoney(details.balance, details.currency)} note={$t('billing.balanceNote')} icon="wallet" accent="green" />
    <StatCard
      label={$t('billing.topup.waiting')}
      value={String(details.pendingTopups)}
      note={pending.length ? $t('billing.topup.waitingNote') : $t('billing.topup.none')}
      icon="clock"
      accent={pending.length ? 'orange' : 'slate'}
    />
  </div>

  <!-- Заявки, що чекають оплати: реквізити й призначення платежу -->
  {#each pending as topup (topup.id)}
    <Panel title={$t('billing.topup.payTitle', { reference: topup.reference })}>
      <div class="pay">
        <div class="pay__info">
          <Badge tone={topup.method === 'card' ? 'blue' : 'purple'}>{$t(`billing.method.${topup.method}`)}</Badge>
          <Text tone="muted">{$t(topup.method === 'card' ? 'billing.topup.cardHint' : 'billing.topup.bankHint')}</Text>
          {#if details.note}<Text tone="muted">{details.note}</Text>{/if}
        </div>
        {@render requisites(topup)}
      </div>
      <div class="pay__foot">
        <Text tone="muted">{$t('billing.topup.created', { date: $formatDateTime(topup.createdAt) })}</Text>
        <Button variant="ghost" disabled={busy} onclick={() => cancel(topup)}>{$t('billing.topup.cancel')}</Button>
      </div>
    </Panel>
  {/each}

  <Panel title={$t('billing.topup.title')}>
    {#if details.methods.length === 0}
      <EmptyState text={$t('billing.topup.unavailable')} />
    {:else}
      <form class="topup" onsubmit={request}>
        <fieldset class="methods">
          <legend>{$t('billing.topup.chooseMethod')}</legend>
          {#each details.methods as item (item.method)}
            <label class="method" class:is-active={method === item.method}>
              <input type="radio" name="method" value={item.method} checked={method === item.method} onchange={() => (method = item.method)} />
              <span class="method__icon"><Icon name={item.method === 'card' ? 'wallet' : 'file'} size={18} /></span>
              <span>
                <b>{$t(`billing.method.${item.method}`)}</b>
                <small>{$t(item.method === 'card' ? 'billing.method.cardText' : 'billing.method.bankText')}</small>
              </span>
            </label>
          {/each}
        </fieldset>

        <div class="amount">
          <label>
            <span>{$t('billing.amount')}, {details.currency}</span>
            <input type="text" inputmode="decimal" required bind:value={amount} placeholder={details.minTopup} autocomplete="off" />
          </label>
          <div class="quick">
            {#each QUICK as value (value)}
              <button type="button" class:is-active={Number(amount) === value} onclick={() => (amount = String(value))}>{value}</button>
            {/each}
          </div>
          <Text tone="muted">{$t('billing.topup.min', { amount: $formatMoney(details.minTopup, details.currency) })}</Text>
        </div>

        <div class="topup__submit">
          <Button type="submit" disabled={busy || !method || !amount}>{$t('billing.topup.submit')}</Button>
        </div>
      </form>
    {/if}
    <ErrorText message={error} />
  </Panel>

  {#if details.topups.some((item) => item.status !== 'pending')}
    <Panel title={$t('billing.topup.history')} flush>
      <DataTable>
        {#snippet head()}
          <tr><th>{$t('common.date')}</th><th>{$t('billing.req.reference')}</th><th>{$t('billing.topup.method')}</th><th>{$t('billing.amount')}</th><th>{$t('billing.topup.status')}</th></tr>
        {/snippet}
        {#snippet body()}
          {#each details!.topups.filter((item) => item.status !== 'pending') as row (row.id)}
            <tr>
              <td class="muted">{$formatDateTime(row.createdAt)}</td>
              <td class="mono">{row.reference}</td>
              <td>{$t(`billing.method.${row.method}`)}</td>
              <td>{$formatMoney(row.amount, details!.currency)}</td>
              <td><Badge tone={STATUS_TONE[row.status]}>{$t(`billing.topup.${row.status}`)}</Badge>{#if row.note} <span class="muted">{row.note}</span>{/if}</td>
            </tr>
          {/each}
        {/snippet}
      </DataTable>
    </Panel>
  {/if}

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
              <td><Badge tone={KIND_TONE[row.kind]}>{$tx(`billing.kind.${row.kind}`, row.kind)}</Badge> {row.note ?? ''}</td>
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
    grid-template-columns: repeat(auto-fit, minmax(min(260px, 100%), 1fr));
    gap: 12px;
  }

  /* ---------- Заявка, що чекає оплати ---------- */

  .pay {
    display: grid;
    grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
    gap: 20px;
  }

  .pay__info {
    display: grid;
    align-content: start;
    justify-items: start;
    gap: 8px;
  }

  .pay__foot {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--ui-border-soft);
  }

  .req {
    display: grid;
    margin: 0;
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius-md);
  }

  .req > div {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 6px 12px;
    padding: 9px 12px;
    border-bottom: 1px solid var(--ui-border-soft);
    font-size: 13px;
  }

  .req > div:last-child {
    border-bottom: 0;
  }

  .req > div.is-key {
    background: var(--ui-accent-soft);
  }

  .req dt {
    color: var(--ui-muted);
  }

  .req dd {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font-weight: 600;
    overflow-wrap: anywhere;
  }

  .mono {
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    letter-spacing: 0.02em;
  }

  .copy {
    display: inline-grid;
    place-items: center;
    width: 26px;
    height: 26px;
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius-sm);
    background: var(--ui-surface);
    color: var(--ui-muted);
    cursor: pointer;
  }

  .copy:hover {
    border-color: var(--ui-border-strong);
    color: var(--ui-text);
  }

  /* ---------- Нова заявка ---------- */

  .topup {
    display: grid;
    gap: 18px;
  }

  .methods {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(240px, 100%), 1fr));
    gap: 10px;
    margin: 0;
    padding: 0;
    border: 0;
  }

  .methods legend {
    margin-bottom: 8px;
    padding: 0;
    font-weight: 700;
  }

  .method {
    position: relative;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius-md);
    background: var(--ui-surface);
    cursor: pointer;
  }

  .method:hover {
    border-color: var(--ui-border-strong);
  }

  .method.is-active {
    border-color: var(--ui-accent);
    box-shadow: inset 3px 0 0 var(--ui-accent);
  }

  .method input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }

  .method:has(input:focus-visible) {
    outline: 2px solid var(--ui-focus);
    outline-offset: 2px;
  }

  .method > span:last-child {
    display: grid;
    gap: 2px;
  }

  .method small {
    color: var(--ui-muted);
    font-size: 12px;
  }

  .method__icon {
    display: grid;
    flex: none;
    place-items: center;
    width: 36px;
    height: 36px;
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius-md);
    color: var(--ui-text-2);
  }

  .method.is-active .method__icon {
    border-color: color-mix(in srgb, var(--ui-accent) 45%, transparent);
    background: var(--ui-accent-soft);
    color: var(--ui-accent);
  }

  .amount {
    display: grid;
    gap: 8px;
    max-width: 420px;
  }

  .amount label {
    display: grid;
    gap: 6px;
    font-weight: 700;
  }

  .amount input {
    height: 38px;
    padding: 0 12px;
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius-md);
    background: var(--ui-surface);
    color: inherit;
    font: inherit;
    font-size: 16px;
    font-weight: 700;
  }

  .amount input:focus {
    border-color: var(--ui-accent);
    outline: none;
  }

  .quick {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .quick button {
    height: 28px;
    padding: 0 12px;
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius-sm);
    background: var(--ui-surface);
    color: var(--ui-text-2);
    font: inherit;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
  }

  .quick button:hover,
  .quick button.is-active {
    border-color: var(--ui-accent);
    color: var(--ui-text);
  }

  .topup__submit {
    display: flex;
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
    .pay {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
