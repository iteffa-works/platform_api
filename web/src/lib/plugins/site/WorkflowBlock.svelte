<script lang="ts">
  /** Як почати: три кроки від тарифу до сайту онлайн */
  import { useI18n } from '$lib/i18n';

  const { t } = useI18n();

  const steps = ['step1', 'step2', 'step3'] as const;
</script>

<section class="lp-section" id="how">
  <div class="ui-container">
    <div class="lp-head">
      <p class="lp-eyebrow">{$t('landing.how.eyebrow')}</p>
      <h2 class="lp-title">{$t('landing.how.title')}</h2>
    </div>
    <ol class="steps">
      {#each steps as step, index (step)}
        <li class="step">
          <span class="step__num">{String(index + 1).padStart(2, '0')}</span>
          <h3>{$t(`landing.how.${step}.title`)}</h3>
          <p>{$t(`landing.how.${step}.text`)}</p>
        </li>
      {/each}
    </ol>
  </div>
</section>

<style>
  .steps {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(280px, 100%), 1fr));
    margin: 0;
    padding: 0;
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius-lg);
    background: var(--ui-surface);
    list-style: none;
  }

  .step {
    padding: 22px 20px;
  }

  .step + .step {
    border-left: 1px solid var(--ui-border);
  }

  .step__num {
    color: var(--ui-accent);
    font-size: 13px;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.06em;
  }

  .step h3 {
    margin: 10px 0 6px;
    font-size: 16px;
    font-weight: 700;
  }

  .step p {
    margin: 0;
    color: var(--ui-muted);
    font-size: 13px;
    line-height: 1.55;
  }

  @media (max-width: 900px) {
    .step + .step {
      border-top: 1px solid var(--ui-border);
      border-left: 0;
    }
  }
</style>
