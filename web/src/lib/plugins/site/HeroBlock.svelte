<script lang="ts">
  /** Hero головної: оффер хостингу, CTA і панель «Стан сервісу» з живими даними вітрини */
  import { onMount } from 'svelte';
  import { useI18n } from '$lib/i18n';
  import { formatMoney } from '$lib/shared/utils';
  import { Button, Flag, Icon } from '$lib/ui/elements';
  import { isFree, loadShowcase, lowestPaid, orderHref, showcase } from './catalog.js';

  const { t, locale } = useI18n();

  onMount(loadShowcase);

  const free = $derived($showcase?.plans.find(isFree) ?? null);
  const cheapest = $derived($showcase ? lowestPaid($showcase) : null);
  const regionName = (code: string) => {
    try {
      return new Intl.DisplayNames([$locale], { type: 'region' }).of(code) ?? code;
    } catch {
      return code;
    }
  };

  const points = ['landing.hero.point1', 'landing.hero.point2', 'landing.hero.point3'] as const;
</script>

<section class="hero">
  <div class="ui-container hero__grid">
    <div class="hero__copy">
      <p class="hero__badge"><span></span>{$t('landing.hero.badge')}</p>
      <h1 class="hero__title">
        {$t('landing.hero.title')}
        <em>{cheapest ? $t('landing.hero.titleFrom', { price: $formatMoney(cheapest.price, $showcase!.currency) }) : $t('landing.hero.titleAccent')}</em>
      </h1>
      <p class="hero__lead">{$t('landing.hero.lead')}</p>
      <div class="hero__actions">
        <Button size="lg" href="#plans">{$t('landing.hero.choose')}</Button>
        {#if free}<Button size="lg" variant="ghost" href={orderHref(free)}>{$t('landing.hero.tryFree')}</Button>{/if}
      </div>
      <ul class="hero__points">
        {#each points as point (point)}
          <li><Icon name="check" size={14} />{$t(point)}</li>
        {/each}
      </ul>
    </div>

    <aside class="status" aria-label={$t('landing.status.title')}>
      <header class="status__head">
        <span>{$t('landing.status.title')}</span>
        <span class="status__live">{$t('landing.status.online')}</span>
      </header>
      <dl class="status__rows">
        <div><dt>{$t('landing.status.plans')}</dt><dd>{$showcase ? $showcase.plans.length : '—'}</dd></div>
        <div>
          <dt>{$t('landing.status.from')}</dt>
          <dd>{cheapest ? `${$formatMoney(cheapest.price, $showcase!.currency)} ${$t('landing.plans.perMonth')}` : '—'}</dd>
        </div>
        {#if free}<div><dt>{free.name}</dt><dd class="is-ok">{$t('landing.status.free')}</dd></div>{/if}
        <div>
          <dt>{$t('landing.status.locations')}</dt>
          <dd class="status__flags">
            {#each $showcase?.locations ?? [] as code (code)}
              <span><Flag {code} size={16} />{regionName(code)}</span>
            {:else}—{/each}
          </dd>
        </div>
      </dl>
      <footer class="status__foot">
        {#each ['NVMe', 'SSL', 'ISPmanager 6', 'PHP 8.x'] as tag (tag)}<span>{tag}</span>{/each}
      </footer>
    </aside>
  </div>
</section>

<style>
  .hero {
    position: relative;
    overflow: hidden;
    padding: 72px 0 64px;
    border-bottom: 1px solid var(--ui-border);
  }

  /* Тонка «інженерна» сітка тла, що згасає до країв */
  .hero::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(var(--ui-border-soft) 1px, transparent 1px),
      linear-gradient(90deg, var(--ui-border-soft) 1px, transparent 1px);
    background-size: 44px 44px;
    -webkit-mask-image: radial-gradient(ellipse 70% 80% at 70% 40%, #000 20%, transparent 75%);
    mask-image: radial-gradient(ellipse 70% 80% at 70% 40%, #000 20%, transparent 75%);
    pointer-events: none;
  }

  .hero__grid {
    position: relative;
  }

  .hero__grid {
    display: grid;
    grid-template-columns: minmax(0, 1.25fr) minmax(300px, 0.75fr);
    align-items: center;
    gap: 48px;
  }

  .hero__badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 18px;
    padding: 4px 10px;
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius-md);
    background: var(--ui-surface);
    color: var(--ui-text-2);
    font-size: 12px;
    font-weight: 600;
  }

  .hero__badge span {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--ui-accent);
  }

  .hero__title {
    margin: 0;
    font-size: clamp(30px, 4.4vw, 48px);
    font-weight: 800;
    line-height: 1.08;
  }

  .hero__title em {
    display: block;
    color: var(--ui-accent);
    font-style: normal;
  }

  .hero__lead {
    max-width: 600px;
    margin: 18px 0 0;
    color: var(--ui-muted);
    font-size: 16px;
    line-height: 1.6;
  }

  .hero__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 28px;
  }

  .hero__points {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 20px;
    margin: 24px 0 0;
    padding: 0;
    list-style: none;
    color: var(--ui-text-2);
    font-size: 13px;
  }

  .hero__points li {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .hero__points :global(.ui-icon) {
    color: var(--ui-success);
  }

  /* Панель стану — як робочі інструменти: рамка, щільні рядки, зелений «онлайн» */
  .status {
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius-lg);
    background: var(--ui-surface);
    font-size: 13px;
  }

  .status__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 16px;
    border-bottom: 2px solid var(--ui-accent);
    font-weight: 700;
  }

  .status__live {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--ui-success);
    font-size: 12px;
    font-weight: 600;
  }

  .status__live::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
  }

  .status__rows {
    margin: 0;
  }

  .status__rows > div {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 16px;
    border-bottom: 1px solid var(--ui-border-soft);
  }

  .status__rows dt {
    color: var(--ui-muted);
  }

  .status__rows dd {
    margin: 0;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    text-align: right;
  }

  .status__rows dd.is-ok {
    color: var(--ui-success);
  }

  .status__flags {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 6px 12px;
  }

  .status__flags span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .status__foot {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding: 12px 16px;
  }

  .status__foot span {
    padding: 2px 8px;
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius-sm);
    color: var(--ui-text-2);
    font-size: 11px;
    font-weight: 600;
  }

  @media (max-width: 900px) {
    .hero {
      padding: 48px 0;
    }

    .hero__grid {
      grid-template-columns: minmax(0, 1fr);
      gap: 32px;
    }
  }
</style>
