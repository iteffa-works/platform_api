<script lang="ts">
  /** Умови використання */
  import { getTermsAccepted, setTermsAccepted } from '$lib/domain/auth/extensions/terms';

  let accepted = $state(getTermsAccepted());

  $effect(() => {
    setTermsAccepted(accepted);
  });
</script>

<section class="terms">
  <h2 class="terms__title">Заголовок умов</h2>
  <div class="terms__box">
    <p>Шаблонний текст умов користування. Замініть на актуальні правила вашої платформи.</p>
    <p>Шаблонний текст про обробку персональних даних.</p>
  </div>
  <label class="terms__check">
    <input type="checkbox" bind:checked={accepted} />
    <span>Текст згоди з умовами</span>
  </label>
</section>

<style>
  .terms {
    display: grid;
    gap: 10px;
  }

  .terms__title {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
  }

  .terms__box {
    display: grid;
    gap: 8px;
    padding: 12px;
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius);
    background: var(--ui-surface-muted);
    font-size: 12px;
    color: var(--ui-muted);
    line-height: 1.45;
  }

  .terms__box p {
    margin: 0;
  }

  .terms__check {
    display: grid;
    grid-template-columns: 18px 1fr;
    gap: 10px;
    align-items: start;
    font-size: 13px;
    cursor: pointer;
  }

  .terms__check input {
    margin-top: 2px;
  }
</style>
