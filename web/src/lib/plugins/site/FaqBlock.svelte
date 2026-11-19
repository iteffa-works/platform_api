<script lang="ts">
  /** Часті питання про хостинг (розкриваються без JS — details / summary) */
  import { useI18n } from '$lib/i18n';
  import { Icon } from '$lib/ui/elements';

  const { t } = useI18n();

  const items = ['q1', 'q2', 'q3', 'q4', 'q5'] as const;
</script>

<section class="lp-section" id="faq">
  <div class="ui-container faq">
    <div class="lp-head">
      <p class="lp-eyebrow">{$t('landing.faq.eyebrow')}</p>
      <h2 class="lp-title">{$t('landing.faq.title')}</h2>
    </div>
    <div class="list">
      {#each items as item, index (item)}
        <details open={index === 0}>
          <summary>{$t(`landing.faq.${item}`)}<Icon name="chevron-down" size={16} /></summary>
          <p>{$t(`landing.faq.${item}.answer`)}</p>
        </details>
      {/each}
    </div>
  </div>
</section>

<style>
  .faq {
    display: grid;
    grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
    gap: 32px;
  }

  .list {
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius-lg);
    background: var(--ui-surface);
  }

  details + details {
    border-top: 1px solid var(--ui-border);
  }

  summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 18px;
    font-size: 14px;
    font-weight: 700;
    list-style: none;
    cursor: pointer;
  }

  summary::-webkit-details-marker {
    display: none;
  }

  summary :global(.ui-icon) {
    flex: none;
    color: var(--ui-muted);
    transition: transform 0.15s;
  }

  details[open] summary :global(.ui-icon) {
    color: var(--ui-accent);
    transform: rotate(180deg);
  }

  details p {
    margin: 0;
    padding: 0 18px 16px;
    color: var(--ui-muted);
    font-size: 13px;
    line-height: 1.6;
  }

  @media (max-width: 900px) {
    .faq {
      grid-template-columns: minmax(0, 1fr);
      gap: 0;
    }
  }
</style>
