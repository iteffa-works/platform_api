<script lang="ts">
  /** Можливості хостингу: що входить у тарифи */
  import { useI18n } from '$lib/i18n';
  import { Icon, type IconName } from '$lib/ui/elements';

  const { t } = useI18n();

  const items = [
    { key: 'nvme', icon: 'server' },
    { key: 'ssl', icon: 'lock' },
    { key: 'backup', icon: 'refresh' },
    { key: 'panel', icon: 'monitor' },
    { key: 'stack', icon: 'layers' },
    { key: 'billing', icon: 'wallet' },
  ] as const satisfies ReadonlyArray<{ key: string; icon: IconName }>;
</script>

<section class="lp-section" id="features">
  <div class="ui-container">
    <div class="lp-head">
      <p class="lp-eyebrow">{$t('landing.features.eyebrow')}</p>
      <h2 class="lp-title">{$t('landing.features.title')}</h2>
      <p class="lp-lead">{$t('landing.features.lead')}</p>
    </div>
    <div class="grid">
      {#each items as item (item.key)}
        <article class="card">
          <span class="card__icon"><Icon name={item.icon} size={18} /></span>
          <h3>{$t(`landing.features.${item.key}.title`)}</h3>
          <p>{$t(`landing.features.${item.key}.text`)}</p>
        </article>
      {/each}
    </div>
  </div>
</section>

<style>
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr));
    gap: 12px;
  }

  .card {
    padding: 18px;
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius-lg);
    background: var(--ui-surface);
  }

  .card__icon {
    display: inline-grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border: 1px solid color-mix(in srgb, var(--ui-accent) 40%, transparent);
    border-radius: var(--ui-radius-md);
    background: var(--ui-accent-soft);
    color: var(--ui-accent);
  }

  .card h3 {
    margin: 14px 0 6px;
    font-size: 15px;
    font-weight: 700;
  }

  .card p {
    margin: 0;
    color: var(--ui-muted);
    font-size: 13px;
    line-height: 1.55;
  }
</style>
