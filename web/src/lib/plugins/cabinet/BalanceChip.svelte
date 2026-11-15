<script lang="ts">
  /** Баланс у шапці → сторінка «Тариф і баланс» */
  import { useI18n } from '$lib/i18n';
  import { formatMoney } from '$lib/shared/utils';
  import { Icon } from '$lib/ui/elements';
  import { billingSummary } from './store.js';

  const { t } = useI18n();
</script>

{#if $billingSummary}
  <a class="balance" href="/app/billing" title={$t('billing.balance')}>
    <Icon name="wallet" />
    {$formatMoney($billingSummary.balance, $billingSummary.currency)}
  </a>
{/if}

<style>
  .balance {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    height: 36px;
    padding: 0 12px;
    color: var(--ui-muted);
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
    white-space: nowrap;
  }

  .balance:hover {
    color: var(--ui-text);
  }
</style>
