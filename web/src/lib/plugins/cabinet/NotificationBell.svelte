<script lang="ts">
  /** Дзвіночок: кількість непрочитаних + останні сповіщення */
  import { useI18n } from '$lib/i18n';
  import { formatDateTime } from '$lib/shared/utils';
  import { Dropdown } from '$lib/ui/components';
  import { Icon } from '$lib/ui/elements';
  import { notificationText } from './notificationText.js';
  import { notifications, readNotifications, unreadCount } from './store.js';

  const { t, tx } = useI18n();
  const latest = $derived($notifications.slice(0, 5));
</script>

<Dropdown label={$t('notifications.title')} width={320}>
  {#snippet trigger()}
    <span class="bell">
      <Icon name="bell" size={18} />
      {#if $unreadCount}<span class="bell__count">{$unreadCount > 9 ? '9+' : $unreadCount}</span>{/if}
    </span>
  {/snippet}
  <div class="menu">
    <header class="menu__head">
      <strong>{$t('notifications.title')}</strong>
      {#if $unreadCount}
        <button type="button" onclick={() => readNotifications()}>{$t('notifications.readAll')}</button>
      {/if}
    </header>
    {#each latest as item (item.id)}
      <p class="menu__item" class:is-unread={!item.read}>
        {notificationText($tx, item)}
        <small>{$formatDateTime(item.createdAt)}</small>
      </p>
    {:else}
      <p class="menu__empty">{$t('notifications.empty')}</p>
    {/each}
    <a class="menu__all" href="/app/notifications">{$t('common.viewAll')}</a>
  </div>
</Dropdown>

<style>
  .bell {
    position: relative;
    display: grid;
    place-items: center;
    color: var(--ui-muted);
  }

  .bell__count {
    position: absolute;
    top: -8px;
    right: -10px;
    min-width: 17px;
    height: 17px;
    padding: 0 4px;
    border-radius: var(--ui-radius-md, 9px);
    background: var(--ui-danger);
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    line-height: 17px;
    text-align: center;
  }

  .menu__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid var(--ui-border);
  }

  .menu__head button,
  .menu__all {
    padding: 0;
    border: 0;
    background: none;
    color: var(--ui-link);
    font: inherit;
    font-size: 13px;
    text-decoration: none;
    cursor: pointer;
  }

  .menu__item {
    display: grid;
    gap: 2px;
    margin: 0;
    padding: 10px 16px;
    border-bottom: 1px solid var(--ui-border);
    font-size: 14px;
  }

  .menu__item.is-unread {
    background: var(--ui-accent-soft);
  }

  .menu__item small,
  .menu__empty {
    color: var(--ui-muted);
    font-size: 12px;
  }

  .menu__empty {
    margin: 0;
    padding: 16px;
    text-align: center;
  }

  .menu__all {
    display: block;
    padding: 10px 16px;
    text-align: center;
  }
</style>
