<script lang="ts">
  /** Контакти при реєстрації */
  import {
    getMessenger,
    getPhone,
    setMessenger,
    setPhone,
  } from '$lib/domain/auth/extensions/contacts';

  let phone = $state(getPhone());
  let messenger = $state(getMessenger());

  $effect(() => {
    setPhone(phone);
  });

  $effect(() => {
    setMessenger(messenger);
  });
</script>

<section class="contacts">
  <h2 class="contacts__title">Контакти</h2>
  <p class="contacts__lead">За потреби вкажіть телефон або месенджер для звʼязку</p>

  <label class="contacts__field">
    Телефон
    <input class="contacts__input" type="tel" bind:value={phone} placeholder="+380…" autocomplete="tel" />
  </label>

  <label class="contacts__field">
    Месенджер
    <input class="contacts__input" type="text" bind:value={messenger} placeholder="@username" autocomplete="off" />
  </label>
</section>

<style>
  .contacts {
    display: grid;
    gap: 10px;
  }

  .contacts__title {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
  }

  .contacts__lead {
    margin: 0;
    font-size: 13px;
    color: var(--ui-muted);
  }

  .contacts__field {
    display: grid;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
  }

  .contacts__input {
    height: var(--ui-control-h);
    padding: 0 12px;
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius);
    background: var(--ui-surface);
    font: inherit;
    font-weight: 500;
  }

  .contacts__input:focus {
    outline: none;
    border-color: var(--ui-focus);
  }
</style>
