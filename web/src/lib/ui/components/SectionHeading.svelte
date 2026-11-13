<script lang="ts">
  /** Заголовок секції лендингу: мітка, заголовок, опис */
  let {
    eyebrow = '',
    title,
    lead = '',
    align = 'center',
  }: {
    eyebrow?: string;
    title: string;
    lead?: string;
    align?: 'center' | 'start';
  } = $props();
</script>

<header class="ui-section-heading" class:is-start={align === 'start'}>
  {#if eyebrow}<p class="ui-section-heading__eyebrow">{eyebrow}</p>{/if}
  <h2 class="ui-section-heading__title">{title}</h2>
  {#if lead}<p class="ui-section-heading__lead">{lead}</p>{/if}
</header>

<style>
  .ui-section-heading {
    display: grid;
    gap: 12px;
    max-width: 640px;
    margin: 0 auto;
    text-align: center;
  }

  .ui-section-heading.is-start {
    margin: 0;
    text-align: left;
  }

  .ui-section-heading__eyebrow {
    margin: 0;
    color: var(--ui-accent);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .ui-section-heading__title {
    margin: 0;
    font-size: clamp(1.6rem, 3vw, 2.2rem);
    line-height: 1.2;
    letter-spacing: -0.02em;
  }

  .ui-section-heading__lead {
    margin: 0;
    color: var(--ui-muted);
    font-size: 17px;
  }
</style>
