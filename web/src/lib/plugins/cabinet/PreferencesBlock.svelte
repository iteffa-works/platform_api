<script lang="ts">
  /** Налаштування: тема інтерфейсу й часовий пояс показу дат (зберігаються в акаунті) */
  import { loadMe, user } from '$lib/domain/auth';
  import { setTheme, theme, type Theme } from '$lib/domain/theme';
  import { errorMessage } from '$lib/shared/utils';
  import { ErrorText, Panel } from '$lib/ui/components';
  import { Text } from '$lib/ui/elements';
  import { updatePreferences } from './api.js';

  const themes: { value: Theme; label: string }[] = [
    { value: 'light', label: 'Світла' },
    { value: 'dark', label: 'Темна' },
  ];

  const browserZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const zones = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : [browserZone];

  let busy = $state(false);
  let error = $state('');

  const selectedZone = $derived($user?.preferences.timezone ?? '');
  /** Список браузера може містити застарілу назву (Europe/Kiev) — збережений пояс додаємо явно */
  const options = $derived(selectedZone && !zones.includes(selectedZone) ? [selectedZone, ...zones] : zones);
  const preview = $derived(
    new Intl.DateTimeFormat('uk-UA', {
      dateStyle: 'long',
      timeStyle: 'short',
      timeZone: selectedZone || undefined,
    }).format(new Date()),
  );

  async function changeZone(event: Event) {
    const value = (event.currentTarget as HTMLSelectElement).value;
    busy = true;
    error = '';
    try {
      await updatePreferences({ timezone: value || null });
      await loadMe();
    } catch (err) {
      error = errorMessage(err);
    } finally {
      busy = false;
    }
  }
</script>

<div class="columns">
  <Panel title="Інтерфейс">
    <div class="theme" role="radiogroup" aria-label="Тема">
      {#each themes as item (item.value)}
        <button
          class="theme__option"
          class:is-active={$theme === item.value}
          type="button"
          role="radio"
          aria-checked={$theme === item.value}
          onclick={() => setTheme(item.value)}
        >{item.label}</button>
      {/each}
    </div>
    <Text tone="muted">Тема зберігається в акаунті й підхоплюється на всіх ваших пристроях.</Text>
  </Panel>

  <Panel title="Дата й час">
    <label class="zone">
      <span>Часовий пояс</span>
      <select value={selectedZone} disabled={busy} onchange={changeZone}>
        <option value="">Як у браузері ({browserZone})</option>
        {#each options as zone (zone)}
          <option value={zone}>{zone}</option>
        {/each}
      </select>
    </label>
    <Text tone="muted">Так показуються дати в кабінеті й адмінці. Зараз: {preview}</Text>
    <ErrorText message={error} />
  </Panel>
</div>

<style>
  .columns {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
    align-items: start;
  }

  .theme {
    display: inline-flex;
    justify-self: start;
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius);
    overflow: hidden;
  }

  .theme__option {
    padding: 8px 18px;
    border: 0;
    background: var(--ui-surface);
    color: var(--ui-muted);
    font-weight: 600;
    cursor: pointer;
  }

  .theme__option + .theme__option {
    border-left: 1px solid var(--ui-border);
  }

  .theme__option.is-active {
    background: var(--ui-accent);
    color: #fff;
  }

  .zone {
    display: grid;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
  }

  .zone select {
    height: var(--ui-control-h);
    padding: 0 10px;
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius);
    background: var(--ui-surface);
    font-weight: 400;
  }

  @media (max-width: 860px) {
    .columns {
      grid-template-columns: 1fr;
    }
  }
</style>
