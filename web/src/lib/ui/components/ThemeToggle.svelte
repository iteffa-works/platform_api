<script lang="ts">
  /**
   * Перемикач світла / темна тема.
   * Іконку обирає CSS за <html data-theme> — правильна одразу після SSR.
   */
  import { toggleTheme } from '$lib/domain/theme';
</script>

<button class="ui-theme" type="button" onclick={toggleTheme} title="Змінити тему" aria-label="Змінити тему">
  <svg class="ui-theme__moon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
  </svg>
  <svg class="ui-theme__sun" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
</button>

<style>
  .ui-theme {
    display: inline-grid;
    place-items: center;
    width: 36px;
    height: 36px;
    padding: 0;
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius);
    background: var(--ui-surface);
    color: var(--ui-muted);
    cursor: pointer;
  }

  .ui-theme:hover {
    color: var(--ui-text);
    border-color: var(--ui-border-strong);
  }

  .ui-theme svg {
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  /* Світла тема: пропонуємо місяць; темна — сонце */
  .ui-theme__sun {
    display: none;
  }

  :global([data-theme='dark']) .ui-theme__moon {
    display: none;
  }

  :global([data-theme='dark']) .ui-theme__sun {
    display: block;
  }
</style>
