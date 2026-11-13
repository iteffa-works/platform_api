<script lang="ts">
  /** Фінальний заклик до дії */
  import HomeActionsBlock from './HomeActionsBlock.svelte';
</script>

<section class="cta">
  <div class="ui-container cta__box">
    <div>
      <h2>Почніть з одного сервісу</h2>
      <p>Створіть акаунт, а решту модулів підключайте, коли знадобляться.</p>
    </div>
    <div class="cta__actions"><HomeActionsBlock size="lg" /></div>
  </div>
</section>

<style>
  .cta {
    padding: 88px 0;
  }

  .cta__box {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    padding: 40px;
    border-radius: 14px;
    background: linear-gradient(135deg, var(--ui-accent), var(--cab-accent));
    color: #fff;
  }

  .cta h2 {
    margin: 0 0 8px;
    font-size: clamp(1.5rem, 3vw, 2rem);
    letter-spacing: -0.02em;
  }

  .cta p {
    margin: 0;
    opacity: 0.85;
  }

  .cta__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  .cta__actions :global(.ui-btn) {
    background: #fff;
    border-color: #fff;
    color: var(--ui-accent);
  }

  .cta__actions :global(.ui-btn:hover:not(:disabled)) {
    background: var(--ui-accent-soft);
    border-color: var(--ui-accent-soft);
  }

  .cta__actions :global(.ui-btn.is-ghost) {
    background: transparent;
    border-color: rgba(255, 255, 255, 0.6);
    color: #fff;
  }

  .cta__actions :global(.ui-btn.is-ghost:hover:not(:disabled)) {
    background: rgba(255, 255, 255, 0.12);
    border-color: #fff;
  }

  @media (max-width: 600px) {
    .cta {
      padding: 56px 0;
    }

    .cta__box {
      padding: 28px 22px;
    }
  }
</style>
