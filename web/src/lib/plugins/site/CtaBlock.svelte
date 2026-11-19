<script lang="ts">
  /** Фінальний заклик: почати з безкоштовного тарифу або обрати платний */
  import { onMount } from 'svelte';
  import { useI18n } from '$lib/i18n';
  import { Button } from '$lib/ui/elements';
  import { isFree, loadShowcase, orderHref, showcase } from './catalog.js';

  const { t } = useI18n();

  onMount(loadShowcase);

  const free = $derived($showcase?.plans.find(isFree) ?? null);
</script>

<section class="cta">
  <div class="ui-container cta__box">
    <div>
      <h2>{$t('landing.cta.title')}</h2>
      <p>{$t('landing.cta.text')}</p>
    </div>
    <div class="cta__actions">
      {#if free}<Button size="lg" href={orderHref(free)}>{$t('landing.plans.startFree')}</Button>{/if}
      <Button size="lg" variant={free ? 'ghost' : 'primary'} href="#plans">{$t('landing.hero.choose')}</Button>
    </div>
  </div>
</section>

<style>
  .cta {
    padding: 56px 0;
  }

  .cta__box {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    padding: 28px;
    border: 1px solid var(--ui-border);
    border-left: 3px solid var(--ui-accent);
    border-radius: var(--ui-radius-lg);
    background: var(--ui-surface);
  }

  h2 {
    margin: 0;
    font-size: 22px;
    font-weight: 800;
  }

  p {
    margin: 6px 0 0;
    color: var(--ui-muted);
    font-size: 14px;
  }

  .cta__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
</style>
