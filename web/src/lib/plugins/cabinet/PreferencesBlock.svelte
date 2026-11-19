<script lang="ts">
  /** Налаштування: тема, мова, часовий пояс (зберігаються в акаунті), групи сповіщень */
  import { onMount } from 'svelte';
  import { loadMe, user } from '$lib/domain/auth';
  import { setTheme, theme, type Theme } from '$lib/domain/theme';
  import { LOCALE_NAMES, LOCALES, setLocale, useI18n, type Locale } from '$lib/i18n';
  import { errorMessage, formatDateTime } from '$lib/shared/utils';
  import { DataTable, ErrorText, Panel } from '$lib/ui/components';
  import { Button, Text } from '$lib/ui/elements';
  import { fetchNotificationSettings, updateNotificationSettings, updatePreferences, type NotificationGroupSetting } from './api.js';

  const { locale, t } = useI18n();

  const themes: { value: Theme; label: 'prefs.light' | 'prefs.dark' }[] = [
    { value: 'light', label: 'prefs.light' },
    { value: 'dark', label: 'prefs.dark' },
  ];

  const browserZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const zones = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : [browserZone];

  let busy = $state(false);
  let error = $state('');

  /* Групи сповіщень */
  let groups = $state<NotificationGroupSetting[]>([]);
  let groupsError = $state('');

  onMount(() => {
    fetchNotificationSettings().then((data) => (groups = data.groups)).catch((err) => (groupsError = errorMessage(err)));
  });

  async function toggleGroup(item: NotificationGroupSetting) {
    groupsError = '';
    try {
      groups = (await updateNotificationSettings({ [item.group]: !item.enabled })).groups;
    } catch (err) {
      groupsError = errorMessage(err);
    }
  }

  const selectedZone = $derived($user?.preferences.timezone ?? '');
  /** Список браузера може містити застарілу назву (Europe/Kiev) — збережений пояс додаємо явно */
  const options = $derived(selectedZone && !zones.includes(selectedZone) ? [selectedZone, ...zones] : zones);

  async function save(patch: Parameters<typeof updatePreferences>[0]) {
    busy = true;
    error = '';
    try {
      await updatePreferences(patch);
      await loadMe();
    } catch (err) {
      error = errorMessage(err);
    } finally {
      busy = false;
    }
  }

  function changeZone(event: Event) {
    void save({ timezone: (event.currentTarget as HTMLSelectElement).value || null });
  }
</script>

<div class="columns">
  <Panel title={$t('prefs.interface')}>
    <span class="label">{$t('prefs.theme')}</span>
    <div class="segmented" role="radiogroup" aria-label={$t('prefs.theme')}>
      {#each themes as item (item.value)}
        <button
          class:is-active={$theme === item.value}
          type="button"
          role="radio"
          aria-checked={$theme === item.value}
          onclick={() => setTheme(item.value)}
        >{$t(item.label)}</button>
      {/each}
    </div>

    <span class="label">{$t('prefs.language')}</span>
    <div class="segmented" role="radiogroup" aria-label={$t('prefs.language')}>
      {#each LOCALES as item (item)}
        <button
          class:is-active={$locale === item}
          type="button"
          role="radio"
          aria-checked={$locale === item}
          onclick={() => setLocale(item as Locale)}
        >{LOCALE_NAMES[item]}</button>
      {/each}
    </div>
    <Text tone="muted">{$t('prefs.syncHint')}</Text>
  </Panel>

  <Panel title={$t('prefs.dateTime')}>
    <label class="zone">
      <span>{$t('prefs.timezone')}</span>
      <select value={selectedZone} disabled={busy} onchange={changeZone}>
        <option value="">{$t('prefs.browserZone', { zone: browserZone })}</option>
        {#each options as zone (zone)}
          <option value={zone}>{zone}</option>
        {/each}
      </select>
    </label>
    <Text tone="muted">{$t('prefs.zoneHint', { now: $formatDateTime(new Date()) })}</Text>
  </Panel>
</div>

<ErrorText message={error} />

<Panel title={$t('notifyPrefs.title')} flush>
  <p class="lead">{$t('notifyPrefs.hint')}</p>
  <DataTable>
    {#snippet head()}
      <tr><th>{$t('notifyPrefs.group')}</th><th class="center">{$t('notifyPrefs.channel')}</th></tr>
    {/snippet}
    {#snippet body()}
      {#each groups as item (item.group)}
        <tr>
          <td>
            <strong class="group">{$t(`notifyPrefs.${item.group}`)}</strong>
            <span class="group__hint">{$t(`notifyPrefs.${item.group}Hint`)}</span>
          </td>
          <td class="center">
            <input
              type="checkbox"
              checked={item.enabled}
              disabled={item.locked}
              title={item.locked ? $t('notifyPrefs.always') : undefined}
              aria-label={$t(`notifyPrefs.${item.group}`)}
              onchange={() => toggleGroup(item)}
            />
          </td>
        </tr>
      {/each}
    {/snippet}
  </DataTable>
  {#if groupsError}<div class="pad"><ErrorText message={groupsError} /></div>{/if}
</Panel>

<style>
  .columns {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
    align-items: start;
  }

  .label,
  .zone {
    font-size: 13px;
    font-weight: 600;
  }

  .segmented {
    display: inline-flex;
    justify-self: start;
    flex-wrap: wrap;
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius);
    overflow: hidden;
  }

  .segmented button {
    padding: 8px 16px;
    border: 0;
    background: var(--ui-surface);
    color: var(--ui-muted);
    font-weight: 600;
    cursor: pointer;
  }

  .segmented button + button {
    border-left: 1px solid var(--ui-border);
  }

  .segmented button.is-active {
    background: var(--ui-accent);
    color: #fff;
  }

  .zone {
    display: grid;
    gap: 6px;
  }

  .zone select {
    height: var(--ui-control-h);
    padding: 0 10px;
    border: 1px solid var(--ui-border);
    border-radius: var(--ui-radius);
    background: var(--ui-surface);
    font-weight: 400;
  }

  .lead {
    margin: 0;
    padding: 12px 16px;
    border-bottom: 1px solid var(--ui-border);
    color: var(--ui-muted);
    font-size: 13px;
  }

  .group {
    display: block;
    font-size: 13px;
  }

  .group__hint {
    color: var(--ui-muted);
    font-size: 12px;
  }

  .center {
    width: 140px;
    text-align: center;
  }

  .center input {
    width: 16px;
    height: 16px;
    accent-color: var(--ui-accent);
    cursor: pointer;
  }

  .center input:disabled {
    cursor: not-allowed;
  }

  .pad {
    padding: 12px 16px;
  }

  @media (max-width: 860px) {
    .columns {
      grid-template-columns: 1fr;
    }
  }
</style>
