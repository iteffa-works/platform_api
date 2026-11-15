<script lang="ts">
  /** Перемикач мови: код поточної мови → список мов (як EN ▾ у шапці) */
  import { LOCALE_NAMES, LOCALES, setLocale, useI18n } from '$lib/i18n';
  import { Icon } from '$lib/ui/elements';
  import Dropdown from './Dropdown.svelte';

  const { locale, t } = useI18n();
</script>

<Dropdown label={$t('lang.choose')} width={190}>
  {#snippet trigger()}<span class="lang__code">{$locale.toUpperCase()}</span>{/snippet}
  <ul class="lang__list" role="menu">
    {#each LOCALES as item (item)}
      <li>
        <button type="button" role="menuitemradio" aria-checked={item === $locale} onclick={() => setLocale(item)}>
          <span class="lang__mark">{#if item === $locale}<Icon name="check" />{/if}</span>
          {LOCALE_NAMES[item]}
        </button>
      </li>
    {/each}
  </ul>
</Dropdown>

<style>
  .lang__code {
    font-size: 13px;
    font-weight: 600;
  }

  .lang__list {
    margin: 0;
    padding: 6px 0;
    list-style: none;
  }

  .lang__list button {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 9px 14px;
    border: 0;
    background: transparent;
    color: var(--ui-text);
    font: inherit;
    font-size: 14px;
    text-align: left;
    cursor: pointer;
  }

  .lang__list button:hover {
    background: var(--ui-surface-muted);
  }

  .lang__mark {
    display: inline-grid;
    width: 16px;
    color: var(--ui-success);
  }
</style>
