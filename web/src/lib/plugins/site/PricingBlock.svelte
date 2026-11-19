<script lang="ts">
  /**
   * Тарифи на головній — основна інформація: ціна за обраний строк, ключові ліміти, можливості, замовлення.
   * Тарифи й ліміти — з адмінки (шаблони панелі) через `/public/hosting/plans`; хостинг вимкнено — секції немає.
   */
  import { onMount } from 'svelte';
  import { useI18n } from '$lib/i18n';
  import { formatMoney } from '$lib/shared/utils';
  import { Button, Icon } from '$lib/ui/elements';
  import { isFree, loadShowcase, orderHref, showcase, size, type ShowcasePlan } from './catalog.js';

  const { t } = useI18n();

  onMount(loadShowcase);

  let months = $state(1);

  const total = (plan: ShowcasePlan) => (Number(plan.price) * months).toFixed(2);

  /** Ключові ліміти картки: null — без обмеження, 0 — немає */
  function limits(plan: ShowcasePlan) {
    const count = (value: number | null) => (value === null ? $t('landing.limit.unlimited') : value === 0 ? null : String(value));
    return [
      { label: $t('landing.limit.disk'), value: size(plan.diskMb) ?? $t('landing.limit.unlimited') },
      { label: $t('landing.limit.sites'), value: count(plan.sites) },
      { label: $t('landing.limit.databases'), value: count(plan.databases) },
      { label: $t('landing.limit.mailboxes'), value: count(plan.mailboxes) },
    ];
  }

  /** Структуровані дані: каталог тарифів з цінами (Offer) — для пошукових систем */
  const offersLd = $derived($showcase ? JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'OfferCatalog',
    name: $t('landing.plans.title'),
    itemListElement: $showcase.plans.map((plan) => ({
      '@type': 'Offer',
      name: plan.name,
      description: plan.description ?? undefined,
      price: plan.price,
      priceCurrency: $showcase!.currency,
      availability: 'https://schema.org/InStock',
      category: 'Web hosting',
    })),
  }).replace(/</g, '\\u003c') : null);

  function features(plan: ShowcasePlan) {
    const on = plan.features;
    return [
      { label: $t('landing.limit.ssl'), on: on?.ssl ?? true },
      { label: $t('landing.limit.backup'), on: on?.backup ?? false },
      { label: $t('landing.limit.ssh'), on: on?.ssh ?? false },
      { label: $t('landing.limit.nodejs'), on: on?.nodejs ?? false },
    ];
  }
</script>

<svelte:head>
  {#if offersLd}{@html `<script type="application/ld+json">${offersLd}</script>`}{/if}
</svelte:head>

{#if $showcase !== null}
  <section class="lp-section" id="plans">
    <div class="ui-container">
      <div class="plans__top">
        <div class="lp-head">
          <p class="lp-eyebrow">{$t('landing.plans.eyebrow')}</p>
          <h2 class="lp-title">{$t('landing.plans.title')}</h2>
          <p class="lp-lead">{$t('landing.plans.lead')}</p>
        </div>
        {#if $showcase}
          <div class="period" role="radiogroup" aria-label={$t('landing.plans.period')}>
            {#each $showcase.periods as period (period)}
              <button type="button" role="radio" aria-checked={months === period} class:is-active={months === period} onclick={() => (months = period)}>
                {$t('landing.plans.months', { count: period })}
              </button>
            {/each}
          </div>
        {/if}
      </div>

      {#if $showcase === undefined}
        <div class="plans" aria-busy="true">
          {#each { length: 4 } as _, index (index)}<div class="plan is-skeleton"></div>{/each}
        </div>
      {:else}
        <div class="plans">
          {#each $showcase.plans as plan (plan.id)}
            <article class="plan" class:is-featured={plan.featured}>
              <header class="plan__head">
                <h3>{plan.name}</h3>
                {#if plan.featured}<span class="plan__badge">{$t('landing.plans.popular')}</span>{/if}
              </header>
              {#if plan.description}<p class="plan__desc">{plan.description}</p>{/if}

              <div class="plan__price">
                {#if isFree(plan)}
                  <b>{$t('landing.plans.free')}</b>
                {:else}
                  <b>{$formatMoney(plan.price, $showcase.currency)}</b>
                  <span>{$t('landing.plans.perMonth')}</span>
                {/if}
              </div>
              <p class="plan__total">
                {#if !isFree(plan) && months > 1}{$t('landing.plans.total', { total: $formatMoney(total(plan), $showcase.currency), months })}{:else}&nbsp;{/if}
              </p>

              <dl class="plan__limits">
                {#each limits(plan) as item (item.label)}
                  <div class:is-off={item.value === null}><dt>{item.label}</dt><dd>{item.value ?? '—'}</dd></div>
                {/each}
              </dl>

              <ul class="plan__features">
                {#each features(plan) as item (item.label)}
                  <li class:is-off={!item.on}><Icon name={item.on ? 'check' : 'close'} size={14} />{item.label}</li>
                {/each}
              </ul>

              <div class="plan__cta">
                <Button variant={plan.featured ? 'primary' : 'ghost'} href={orderHref(plan, isFree(plan) ? 1 : months)}>
                  {isFree(plan) ? $t('landing.plans.startFree') : $t('landing.plans.order')}
                </Button>
              </div>
            </article>
          {/each}
        </div>
        <p class="plans__more"><a href="#compare">{$t('landing.plans.compareLink')} →</a></p>
      {/if}
    </div>
  </section>
{/if}

<style>
  .plans__top {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
  }

  .period {
    display: inline-flex;
    gap: 4px;
    margin-bottom: 28px;
    padding: 4px;
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius-md);
    background: var(--ui-surface);
  }

  .period button {
    height: 30px;
    padding: 0 14px;
    border: 0;
    border-radius: var(--ui-radius-sm);
    background: transparent;
    color: var(--ui-text-2);
    font: inherit;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
  }

  .period button:hover {
    color: var(--ui-text);
  }

  .period button.is-active {
    background: var(--ui-accent);
    color: #fff;
  }

  .plans {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(210px, 100%), 1fr));
    gap: 12px;
  }

  .plan {
    position: relative;
    display: flex;
    flex-direction: column;
    padding: 20px 18px 18px;
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius-lg);
    background: var(--ui-surface);
  }

  .plan.is-featured {
    border-color: var(--ui-accent);
    box-shadow: inset 0 3px 0 var(--ui-accent);
  }

  .plan.is-skeleton {
    min-height: 420px;
    background: linear-gradient(90deg, var(--ui-surface-muted) 25%, var(--ui-surface) 50%, var(--ui-surface-muted) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.2s linear infinite;
  }

  @keyframes shimmer {
    from { background-position: 200% 0; }
    to { background-position: -200% 0; }
  }

  .plan__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .plan__head h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 800;
  }

  .plan__badge {
    padding: 2px 8px;
    border: 1px solid color-mix(in srgb, var(--ui-accent) 50%, transparent);
    border-radius: var(--ui-radius-sm);
    background: var(--ui-accent-soft);
    color: var(--ui-accent);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.03em;
    text-transform: uppercase;
  }

  .plan__desc {
    min-height: 2.8em;
    margin: 6px 0 0;
    color: var(--ui-muted);
    font-size: 13px;
    line-height: 1.4;
  }

  .plan__price {
    display: flex;
    align-items: baseline;
    gap: 6px;
    margin-top: 16px;
  }

  .plan__price b {
    font-size: 28px;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
  }

  .plan__price span,
  .plan__total {
    color: var(--ui-muted);
    font-size: 12px;
  }

  .plan__total {
    margin: 2px 0 0;
  }

  .plan__limits {
    display: grid;
    margin: 16px 0 0;
    border-top: 1px solid var(--ui-border-soft);
  }

  .plan__limits > div {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    padding: 8px 0;
    border-bottom: 1px solid var(--ui-border-soft);
    font-size: 13px;
  }

  .plan__limits dt {
    color: var(--ui-muted);
  }

  .plan__limits dd {
    margin: 0;
    font-weight: 700;
    text-align: right;
  }

  .plan__limits .is-off dd {
    color: var(--ui-muted);
    font-weight: 400;
  }

  .plan__features {
    display: grid;
    gap: 6px;
    margin: 14px 0 0;
    padding: 0;
    list-style: none;
    font-size: 13px;
  }

  .plan__features li {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .plan__features :global(.ui-icon) {
    color: var(--ui-success);
  }

  .plan__features li.is-off {
    color: var(--ui-muted);
  }

  .plan__features li.is-off :global(.ui-icon) {
    color: var(--ui-muted);
    opacity: 0.6;
  }

  .plan__cta {
    display: grid;
    margin-top: auto;
    padding-top: 18px;
  }

  .plans__more {
    margin: 18px 0 0;
    font-size: 13px;
  }

  .plans__more a {
    color: var(--ui-text-2);
    font-weight: 600;
    text-decoration: none;
  }

  .plans__more a:hover {
    color: var(--ui-accent);
  }

  @media (prefers-reduced-motion: reduce) {
    .plan.is-skeleton {
      animation: none;
    }
  }
</style>
