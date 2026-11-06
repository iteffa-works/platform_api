<script lang="ts">
  /** Логотип / назва бренду (light/dark синхронно для майбутньої теми) */
  import { APP_NAME } from '$lib/config';

  let {
    href = '/',
    image = false,
  }: {
    href?: string;
    image?: boolean;
  } = $props();
</script>

<a class="ui-brand" class:is-image={image} {href} aria-label={APP_NAME}>
  {#if image}
    <span class="ui-brand__mark" aria-hidden="true">
      <img class="ui-brand__logo ui-brand__logo--light" src="/brand/logo_dark.png" alt="" />
      <img class="ui-brand__logo ui-brand__logo--dark" src="/brand/logo_light.png" alt="" />
    </span>
  {:else}
    {APP_NAME}
  {/if}
</a>

<style>
  .ui-brand {
    font-size: 18px;
    font-weight: 700;
    color: var(--ui-text);
    text-decoration: none;
  }

  .ui-brand.is-image {
    display: inline-flex;
    align-items: center;
  }

  .ui-brand__mark {
    display: inline-grid;
    place-items: center;
  }

  .ui-brand__logo {
    grid-area: 1 / 1;
    display: block;
    height: 28px;
    width: auto;
    object-fit: contain;
    object-position: center;
    user-select: none;
    -webkit-user-drag: none;
  }


  /* Світла тема: темний логотип */
  .ui-brand__logo--light {
    opacity: 1;
  }

  .ui-brand__logo--dark {
    opacity: 0;
  }

  /* Темна тема (готово до data-theme="dark") */
  :global([data-theme='dark']) .ui-brand__logo--light,
  :global(:root.dark) .ui-brand__logo--light {
    opacity: 0;
  }

  :global([data-theme='dark']) .ui-brand__logo--dark,
  :global(:root.dark) .ui-brand__logo--dark {
    opacity: 1;
  }
</style>
