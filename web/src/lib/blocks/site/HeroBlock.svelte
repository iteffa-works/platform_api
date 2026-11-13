<script lang="ts">
  /** Hero лендингу: оффер, CTA і превʼю кабінету */
  import HomeActionsBlock from './HomeActionsBlock.svelte';

  const points = ['Єдиний вхід і ролі', 'REST API для автоматизації', 'Desktop-клієнт і SDK'] as const;

  const services = [
    { name: 'Identity', state: 'ok' },
    { name: 'Secrets', state: 'ok' },
    { name: 'Storage', state: 'ok' },
    { name: 'Pipelines', state: 'busy' },
    { name: 'Observability', state: 'ok' },
  ] as const;

  const bars = [38, 52, 44, 66, 58, 74, 63, 82, 70, 88, 79, 92] as const;
</script>

<section class="hero">
  <div class="ui-container hero__grid">
    <div class="hero__copy">
      <p class="hero__badge"><span></span>Хмарна платформа для команд</p>
      <h1 class="hero__title">Уся інфраструктура команди — <em>в одному кабінеті</em></h1>
      <p class="hero__lead">
        Доступи, секрети, сховище, пайплайни й моніторинг під одним акаунтом.
        Керуйте з вебкабінету, автоматизуйте через API.
      </p>
      <div class="hero__actions"><HomeActionsBlock size="lg" /></div>
      <ul class="hero__points">
        {#each points as point (point)}
          <li>{point}</li>
        {/each}
      </ul>
    </div>

    <div class="hero__preview" aria-hidden="true">
      <div class="preview">
        <div class="preview__bar"><i></i><i></i><i></i></div>
        <div class="preview__body">
          <aside class="preview__side">
            {#each services as service (service.name)}
              <span class="preview__service" data-state={service.state}>{service.name}</span>
            {/each}
          </aside>
          <div class="preview__main">
            <div class="preview__stats">
              <div><small>Сервіси</small><b>5</b></div>
              <div><small>Запити / хв</small><b>1.2k</b></div>
              <div><small>Uptime</small><b>99.9%</b></div>
            </div>
            <div class="preview__chart">
              {#each bars as height, index (index)}
                <span style:height="{height}%"></span>
              {/each}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<style>
  .hero {
    padding: 72px 0 88px;
    background:
      radial-gradient(60% 80% at 85% 10%, color-mix(in srgb, var(--ui-accent) 14%, transparent), transparent 70%),
      linear-gradient(180deg, var(--ui-accent-soft), var(--ui-surface));
    overflow: hidden;
  }

  .hero__grid {
    display: grid;
    grid-template-columns: 1.05fr 1fr;
    gap: 56px;
    align-items: center;
  }

  .hero__copy {
    display: grid;
    gap: 22px;
    justify-items: start;
  }

  .hero__badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    padding: 6px 12px;
    border: 1px solid color-mix(in srgb, var(--ui-accent) 25%, transparent);
    border-radius: 999px;
    background: var(--ui-surface);
    color: var(--ui-accent);
    font-size: 13px;
    font-weight: 600;
  }

  .hero__badge span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--ui-success);
  }

  .hero__title {
    margin: 0;
    font-size: clamp(2.2rem, 5vw, 3.4rem);
    line-height: 1.08;
    letter-spacing: -0.035em;
  }

  .hero__title em {
    font-style: normal;
    color: var(--ui-accent);
  }

  .hero__lead {
    margin: 0;
    max-width: 34rem;
    color: var(--ui-muted);
    font-size: 18px;
    line-height: 1.55;
  }

  .hero__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  .hero__points {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 20px;
    margin: 0;
    padding: 0;
    list-style: none;
    color: var(--ui-muted);
    font-size: 14px;
  }

  .hero__points li::before {
    content: '✓';
    margin-right: 6px;
    color: var(--ui-success);
    font-weight: 700;
  }

  /* Превʼю кабінету */
  .preview {
    border: 1px solid var(--cab-border);
    border-radius: 12px;
    background: var(--cab-bg);
    box-shadow: 0 30px 60px -20px rgba(15, 23, 42, 0.45);
    overflow: hidden;
    transform: perspective(1200px) rotateY(-6deg) rotateX(2deg);
  }

  .preview__bar {
    display: flex;
    gap: 6px;
    padding: 12px 14px;
    border-bottom: 1px solid var(--cab-border);
  }

  .preview__bar i {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--cab-border);
  }

  .preview__body {
    display: grid;
    grid-template-columns: 130px 1fr;
    min-height: 260px;
  }

  .preview__side {
    display: grid;
    align-content: start;
    gap: 4px;
    padding: 14px 10px;
    border-right: 1px solid var(--cab-border);
  }

  .preview__service {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 8px;
    border-radius: 6px;
    color: var(--cab-muted);
    font-size: 12px;
    font-weight: 600;
  }

  .preview__service::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--cab-success);
  }

  .preview__service[data-state='busy']::before {
    background: var(--cab-warn);
  }

  .preview__service:first-child {
    background: var(--cab-surface-2);
    color: var(--cab-text);
  }

  .preview__main {
    display: grid;
    gap: 14px;
    padding: 14px;
  }

  .preview__stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }

  .preview__stats div {
    display: grid;
    gap: 4px;
    padding: 10px;
    border: 1px solid var(--cab-border);
    border-radius: 8px;
    background: var(--cab-surface);
  }

  .preview__stats small {
    color: var(--cab-muted);
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .preview__stats b {
    color: var(--cab-text);
    font-size: 18px;
  }

  .preview__chart {
    display: flex;
    align-items: flex-end;
    gap: 6px;
    height: 120px;
    padding: 12px;
    border: 1px solid var(--cab-border);
    border-radius: 8px;
    background: var(--cab-surface);
  }

  .preview__chart span {
    flex: 1;
    border-radius: 3px 3px 0 0;
    background: linear-gradient(180deg, var(--cab-accent), var(--cab-accent-2));
  }

  @media (max-width: 900px) {
    .hero {
      padding: 48px 0 64px;
    }

    .hero__grid {
      grid-template-columns: 1fr;
      gap: 40px;
    }

    .preview {
      transform: none;
    }
  }

  @media (max-width: 480px) {
    .preview__body {
      grid-template-columns: 1fr;
    }

    .preview__side {
      display: none;
    }
  }
</style>
