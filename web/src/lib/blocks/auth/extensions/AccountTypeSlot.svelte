<script lang="ts">
  /** Тип акаунта */
  import {
    getAccountKind,
    setAccountKind,
    type AccountKind,
  } from '$lib/domain/auth/extensions/account-type';

  const options: Array<{ id: AccountKind; title: string; description: string }> = [
    { id: 'client', title: 'Тип 1', description: 'Опис типу акаунта' },
    { id: 'business', title: 'Тип 2', description: 'Опис типу акаунта' },
  ];

  let kind = $state(getAccountKind());

  $effect(() => {
    setAccountKind(kind);
  });
</script>

<section class="kind">
  <h2 class="kind__title">Заголовок типу акаунта</h2>
  <div class="kind__grid">
    {#each options as item (item.id)}
      <button
        type="button"
        class="kind__card"
        class:is-active={kind === item.id}
        onclick={() => (kind = item.id)}
      >
        <span class="kind__name">{item.title}</span>
        <span class="kind__desc">{item.description}</span>
      </button>
    {/each}
  </div>
</section>

<style>
  .kind {
    display: grid;
    gap: 10px;
  }

  .kind__title {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
  }

  .kind__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .kind__card {
    display: grid;
    gap: 4px;
    padding: 12px;
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius);
    background: var(--ui-surface);
    text-align: left;
    cursor: pointer;
    font: inherit;
  }

  .kind__card.is-active {
    border-color: var(--ui-accent);
    background: var(--ui-accent-soft);
  }

  .kind__name {
    font-size: 13px;
    font-weight: 600;
  }

  .kind__desc {
    font-size: 12px;
    color: var(--ui-muted);
  }

  @media (max-width: 520px) {
    .kind__grid {
      grid-template-columns: 1fr;
    }
  }
</style>
