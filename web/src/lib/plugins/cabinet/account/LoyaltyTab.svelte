<script lang="ts">
  /** Програма лояльності: поточний рівень, прогрес до наступного, усі рівні з порогами */
  import { onMount } from 'svelte';
  import { useI18n } from '$lib/i18n';
  import { errorMessage, formatMoney } from '$lib/shared/utils';
  import { ErrorText, Panel } from '$lib/ui/components';
  import { Icon, Text } from '$lib/ui/elements';
  import { fetchLoyalty, type Loyalty } from '../api.js';

  const { t } = useI18n();

  let data = $state<Loyalty | null>(null);
  let error = $state('');

  onMount(() => {
    fetchLoyalty().then((value) => (data = value)).catch((err) => (error = errorMessage(err)));
  });

  const reachedIndex = $derived(data ? data.tiers.findIndex((item) => item.tier === data!.tier) : -1);
</script>

<div class="tab">
  {#if data}
    <section class="status" data-tier={data.tier}>
      <span class="status__badge"><Icon name="award" size={28} /></span>
      <div class="status__body">
        <span class="status__label">{$t('loyalty.current')}</span>
        <strong class="status__tier">{$t(`loyalty.tier.${data.tier}`)}</strong>
        <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={data.progress}>
          <span style:width="{data.progress}%"></span>
        </div>
        <span class="status__next">
          {#if data.next}
            {$t('loyalty.toNext', { tier: $t(`loyalty.tier.${data.next.tier}`), amount: $formatMoney(data.next.remaining, data.currency) })}
          {:else}
            {$t('loyalty.top')}
          {/if}
        </span>
      </div>
      <div class="status__spent">
        <span>{$t('loyalty.spent')}</span>
        <strong>{$formatMoney(data.spent, data.currency)}</strong>
      </div>
    </section>

    <Panel title={$t('loyalty.levels')} flush>
      <ol class="levels">
        {#each data.tiers as item, index (item.tier)}
          <li class:is-reached={index <= reachedIndex} class:is-current={index === reachedIndex} data-tier={item.tier}>
            <span class="levels__icon"><Icon name="award" size={18} /></span>
            <span class="levels__name">{$t(`loyalty.tier.${item.tier}`)}</span>
            <span class="levels__from">{$t('loyalty.from', { amount: $formatMoney(item.from, data.currency) })}</span>
            <span class="levels__state">{#if index <= reachedIndex}<Icon name="check" size={14} />{$t('loyalty.reached')}{/if}</span>
          </li>
        {/each}
      </ol>
    </Panel>
    <Text tone="muted">{$t('loyalty.hint')}</Text>
  {/if}
  <ErrorText message={error} />
</div>

<style>
  .tab {
    display: grid;
    gap: 16px;
    padding-top: 16px;
  }

  [data-tier='base'] { --tier: var(--ui-muted); }
  [data-tier='bronze'] { --tier: #b5712f; }
  [data-tier='silver'] { --tier: #8a96a3; }
  [data-tier='gold'] { --tier: #d4a017; }
  [data-tier='platinum'] { --tier: #5b8db8; }

  .status {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 20px;
    padding: 20px;
    border: 1px solid var(--ui-border);
    border-top: 3px solid var(--tier);
    border-radius: var(--ui-radius-lg, var(--ui-radius));
    background: var(--ui-surface);
  }

  .status__badge {
    display: grid;
    place-items: center;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: color-mix(in srgb, var(--tier) 14%, transparent);
    color: var(--tier);
  }

  .status__body {
    display: grid;
    gap: 6px;
  }

  .status__label,
  .status__next,
  .status__spent span {
    color: var(--ui-muted);
    font-size: 12px;
  }

  .status__tier {
    font-size: 20px;
  }

  .bar {
    height: 6px;
    max-width: 420px;
    overflow: hidden;
    border-radius: 3px;
    background: var(--ui-border);
  }

  .bar span {
    display: block;
    height: 100%;
    background: var(--tier);
  }

  .status__spent {
    display: grid;
    justify-items: end;
    gap: 4px;
    text-align: right;
  }

  .status__spent strong {
    font-size: 18px;
    font-variant-numeric: tabular-nums;
  }

  .levels {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .levels li {
    display: grid;
    grid-template-columns: 28px minmax(0, 1fr) auto 110px;
    align-items: center;
    gap: 12px;
    padding: 11px 16px;
    border-bottom: 1px solid var(--ui-border);
    color: var(--ui-muted);
  }

  .levels li:last-child {
    border-bottom: 0;
  }

  .levels li.is-reached {
    color: var(--ui-text);
  }

  .levels li.is-current {
    background: color-mix(in srgb, var(--tier) 8%, transparent);
    font-weight: 700;
  }

  .levels__icon {
    color: var(--tier);
    opacity: 0.45;
  }

  .is-reached .levels__icon {
    opacity: 1;
  }

  .levels__from {
    font-size: 13px;
    font-variant-numeric: tabular-nums;
  }

  .levels__state {
    display: inline-flex;
    justify-content: flex-end;
    align-items: center;
    gap: 4px;
    color: var(--ui-success);
    font-size: 12px;
    font-weight: 600;
  }

  @media (max-width: 640px) {
    .status {
      grid-template-columns: auto minmax(0, 1fr);
    }

    .status__spent {
      grid-column: 1 / -1;
      justify-items: start;
      text-align: left;
    }

    .levels li {
      grid-template-columns: 28px minmax(0, 1fr) auto;
    }

    .levels__state {
      display: none;
    }
  }
</style>
