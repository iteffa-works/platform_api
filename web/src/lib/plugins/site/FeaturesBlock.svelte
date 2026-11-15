<script lang="ts">
  /** Сітка можливостей платформи */
  import { useI18n } from '$lib/i18n';
  import { SectionHeading } from '$lib/ui/components';

  const { t } = useI18n();

  const features = [
    {
      title: 'landing.features.identity.title',
      text: 'landing.features.identity.text',
      icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    },
    {
      title: 'landing.features.secrets.title',
      text: 'landing.features.secrets.text',
      icon: 'M21 2l-2 2m-7.6 7.6a5.5 5.5 0 1 1-7.8 7.8 5.5 5.5 0 0 1 7.8-7.8zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4',
    },
    {
      title: 'landing.features.storage.title',
      text: 'landing.features.storage.text',
      icon: 'M12 2C7 2 3 3.3 3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5c0-1.7-4-3-9-3zM3 5c0 1.7 4 3 9 3s9-1.3 9-3M3 12c0 1.7 4 3 9 3s9-1.3 9-3',
    },
    {
      title: 'landing.features.compute.title',
      text: 'landing.features.compute.text',
      icon: 'M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM9 9h6v6H9zM9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3',
    },
    {
      title: 'landing.features.pipelines.title',
      text: 'landing.features.pipelines.text',
      icon: 'M6 3v12M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 9a9 9 0 0 1-9 9',
    },
    {
      title: 'landing.features.monitoring.title',
      text: 'landing.features.monitoring.text',
      icon: 'M22 12h-4l-3 9L9 3l-3 9H2',
    },
  ] as const;
</script>

<section class="features" id="features">
  <div class="ui-container">
    <SectionHeading
      eyebrow={$t('landing.nav.features')}
      title={$t('landing.features.title')}
      lead={$t('landing.features.lead')}
    />
    <div class="features__grid">
      {#each features as feature (feature.title)}
        <article class="features__card">
          <span class="features__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22"><path d={feature.icon} /></svg>
          </span>
          <h3>{$t(feature.title)}</h3>
          <p>{$t(feature.text)}</p>
        </article>
      {/each}
    </div>
  </div>
</section>

<style>
  .features {
    padding: 88px 0;
  }

  .features__grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 20px;
    margin-top: 48px;
  }

  .features__card {
    display: grid;
    gap: 10px;
    align-content: start;
    padding: 24px;
    border: 1px solid var(--ui-border);
    border-radius: 10px;
    background: var(--ui-surface);
    transition: border-color 0.15s ease, transform 0.15s ease;
  }

  .features__card:hover {
    border-color: color-mix(in srgb, var(--ui-accent) 45%, var(--ui-border));
    transform: translateY(-2px);
  }

  .features__icon {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border-radius: 10px;
    background: var(--ui-accent-soft);
    color: var(--ui-accent);
  }

  .features__icon path {
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .features__card h3 {
    margin: 6px 0 0;
    font-size: 17px;
  }

  .features__card p {
    margin: 0;
    color: var(--ui-muted);
  }

  @media (max-width: 900px) {
    .features__grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 600px) {
    .features {
      padding: 64px 0;
    }

    .features__grid {
      grid-template-columns: 1fr;
    }
  }
</style>
