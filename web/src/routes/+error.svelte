<script lang="ts">
  /** Помилка сторінки: у режимі DEBUG — сторінка налагодження, інакше — зрозуміле повідомлення */
  import { page } from '$app/stores';
  import { APP_NAME } from '$lib/config';
  import { useI18n } from '$lib/i18n';
  import DebugPage from '$lib/ui/debug/DebugPage.svelte';

  const { t } = useI18n();

  const status = $derived($page.status || 500);
  const notFound = $derived(status === 404);
  const debug = $derived($page.error?.debug);
</script>

<svelte:head>
  {#if !debug}<title>{status} · {APP_NAME}</title>{/if}
  <meta name="robots" content="noindex" />
</svelte:head>

{#if debug}
  <DebugPage info={debug} {status} />
{:else}
  <main class="err">
    <div class="err__card">
      <span class="err__code">{status}</span>
      <h1 class="err__title">{notFound ? $t('error.notFound') : $t('error.internal')}</h1>
      <p class="err__text">
        {#if notFound}{$t('error.notFoundText')}{:else if status < 500 && $page.error?.message}{$page.error.message}{:else}{$t('error.internalText')}{/if}
      </p>
      <div class="err__actions">
        <a class="err__btn is-primary" href="/">{$t('error.home')}</a>
        {#if notFound}
          <button type="button" class="err__btn" onclick={() => history.back()}>{$t('error.back')}</button>
        {:else}
          <button type="button" class="err__btn" onclick={() => location.reload()}>{$t('error.reload')}</button>
        {/if}
      </div>
    </div>
  </main>
{/if}

<style>
  .err {
    display: grid;
    place-items: center;
    min-height: 100vh;
    padding: 24px 16px;
    background: var(--ui-bg);
    color: var(--ui-text);
  }

  .err__card {
    display: grid;
    justify-items: start;
    gap: 10px;
    width: min(100%, 520px);
    padding: 32px;
    border: 1px solid var(--ui-border);
    border-top: 3px solid var(--ui-accent);
    border-radius: var(--ui-radius-lg, 8px);
    background: var(--ui-surface);
  }

  .err__code {
    color: var(--ui-accent);
    font-size: 44px;
    font-weight: 800;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }

  .err__title {
    margin: 0;
    font-size: 20px;
  }

  .err__text {
    margin: 0 0 8px;
    color: var(--ui-muted);
  }

  .err__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .err__btn {
    display: inline-flex;
    align-items: center;
    height: var(--ui-control-h, 36px);
    padding: 0 16px;
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius, 4px);
    background: var(--ui-surface);
    color: var(--ui-text);
    font: inherit;
    font-weight: 600;
    text-decoration: none;
    cursor: pointer;
  }

  .err__btn.is-primary {
    border-color: var(--ui-accent);
    background: var(--ui-accent);
    color: #fff;
  }
</style>
