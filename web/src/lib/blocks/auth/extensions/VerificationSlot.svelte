<script lang="ts">
  /** Горизонтальні картки верифікації (як у референсі) */
  import {
    getInviteCode,
    getVerificationMethod,
    setInviteCode,
    setVerificationMethod,
    type VerificationMethod,
  } from '$lib/domain/auth/extensions/verification';

  const methods: Array<{
    id: VerificationMethod;
    title: string;
    description: string;
    available: boolean;
    glyph: string;
  }> = [
    { id: 'email', title: 'Спосіб 1', description: 'Опис способу верифікації', available: true, glyph: '✉' },
    { id: 'phone', title: 'Спосіб 2', description: 'Опис способу верифікації', available: false, glyph: '▣' },
    { id: 'invite', title: 'Спосіб 3', description: 'Опис способу верифікації', available: true, glyph: '◈' },
  ];

  let method = $state(getVerificationMethod());
  let invite = $state(getInviteCode());

  $effect(() => { setVerificationMethod(method); });
  $effect(() => { setInviteCode(invite); });
</script>

<section class="verify">
  <h2 class="verify__title">Заголовок верифікації</h2>
  <p class="verify__lead">Підзаголовок блоку вибору способу підтвердження</p>

  <div class="verify__grid">
    {#each methods as item (item.id)}
      <button
        type="button"
        class="verify__card"
        class:is-active={method === item.id}
        class:is-disabled={!item.available}
        disabled={!item.available}
        onclick={() => (method = item.id)}
      >
        <span class="verify__glyph" aria-hidden="true">{item.glyph}</span>
        <span class="verify__name">{item.title}</span>
        <span class="verify__desc">{item.description}</span>
      </button>
    {/each}
  </div>

  {#if method === 'invite'}
    <label class="verify__field">
      Поле коду запрошення
      <input class="verify__input" type="text" bind:value={invite} placeholder="CODE-XXXX" autocomplete="off" />
    </label>
  {:else if method === 'email'}
    <div class="verify__note">Шаблонне повідомлення про наступний крок підтвердження.</div>
  {/if}
</section>

<style>
  .verify { display: grid; gap: 12px; }

  .verify__title {
    margin: 0;
    font-size: 14px;
    font-weight: 650;
    color: #f3f5f9;
  }

  .verify__lead {
    margin: 0;
    font-size: 13px;
    color: #8b97ab;
  }

  .verify__grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
  }

  .verify__card {
    display: grid;
    gap: 6px;
    justify-items: start;
    width: 100%;
    min-height: 108px;
    padding: 14px 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 14px;
    background: #121722;
    text-align: left;
    cursor: pointer;
    font: inherit;
    color: #e8ecf4;
    transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
  }

  .verify__card:hover:not(:disabled) {
    transform: translateY(-2px);
    border-color: rgba(129, 140, 248, 0.35);
  }

  .verify__card.is-active {
    border-color: #6d8cff;
    background: rgba(79, 111, 255, 0.12);
    box-shadow: inset 0 0 0 1px rgba(109, 140, 255, 0.25);
  }

  .verify__card.is-disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .verify__glyph {
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border-radius: 8px;
    background: rgba(99, 102, 241, 0.18);
    color: #a5b4fc;
    font-size: 14px;
    transition: transform 0.2s ease, background 0.2s ease;
  }

  .verify__card:hover:not(:disabled) .verify__glyph {
    transform: scale(1.06);
  }

  .verify__card.is-active .verify__glyph {
    background: rgba(109, 140, 255, 0.28);
    color: #c7d2fe;
  }

  .verify__name {
    font-size: 13px;
    font-weight: 650;
  }

  .verify__desc {
    font-size: 12px;
    line-height: 1.35;
    color: #8b97ab;
  }

  .verify__field {
    display: grid;
    gap: 8px;
    font-size: 13px;
    font-weight: 500;
    color: #9aa3b5;
  }

  .verify__input {
    height: 48px;
    padding: 0 14px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    background: #121722;
    color: #f8fafc;
    font: inherit;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }

  .verify__input:focus {
    outline: none;
    border-color: rgba(129, 140, 248, 0.75);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.18);
  }

  .verify__note {
    padding: 12px 14px;
    border: 1px solid rgba(250, 204, 21, 0.28);
    border-radius: 12px;
    background: rgba(250, 204, 21, 0.06);
    color: #fde68a;
    font-size: 12px;
    line-height: 1.45;
    animation: auth-fade 0.3s ease both;
  }

  @media (max-width: 720px) {
    .verify__grid { grid-template-columns: 1fr; }
  }
</style>
