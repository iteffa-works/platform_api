<script lang="ts">
  /** Шапка сторінки: «назад», заголовок, підзаголовок; праворуч — дії (головна кнопка, «Дії ▾») */
  import { Icon } from '$lib/ui/elements';
  import type { Snippet } from 'svelte';

  let {
    title,
    subtitle,
    back,
    backLabel = 'Back',
    actions,
  }: {
    title: string;
    subtitle?: string;
    /** Посилання «назад» (кругла кнопка ліворуч від заголовка) */
    back?: string;
    backLabel?: string;
    actions?: Snippet;
  } = $props();
</script>

<header class="head">
  <div class="head__title">
    {#if back}
      <a class="head__back" href={back} aria-label={backLabel} title={backLabel}><Icon name="chevron-left" /></a>
    {/if}
    <div>
      <h1>{title}</h1>
      {#if subtitle}<p>{subtitle}</p>{/if}
    </div>
  </div>
  {#if actions}<div class="head__actions">{@render actions()}</div>{/if}
</header>

<style lang="scss">
  .head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: space(3) space(4);
  }

  .head__title {
    display: flex;
    align-items: center;
    gap: space(3);
    min-width: 0;
  }

  h1 {
    color: var(--ui-text);
    font-size: var(--ui-page-title, 24px);
    font-weight: 700;
    letter-spacing: -0.01em;
  }

  p {
    margin: 2px 0 0;
    color: var(--ui-muted);
    font-size: var(--ui-fs-sm);
  }

  .head__back {
    @include icon-button(32px);
    @include focus-ring;
    border: 1px solid var(--ui-border);
    border-radius: 50%;
    background: var(--ui-surface);
  }

  .head__actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: space(2);
  }
</style>
