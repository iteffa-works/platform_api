<script lang="ts">
  /** Сторінка сповіщень: усі останні, позначення прочитаними */
  import { useI18n } from '$lib/i18n';
  import { formatDateTime } from '$lib/shared/utils';
  import { Panel } from '$lib/ui/components';
  import { Button, Icon } from '$lib/ui/elements';
  import { notificationText } from './notificationText.js';
  import { notifications, readNotifications, unreadCount } from './store.js';

  const { t, tx } = useI18n();
</script>

<Panel title={$t('notifications.title')} flush>
  {#if $notifications.length === 0}
    <div class="empty">
      <span class="empty__icon"><Icon name="bell" size={40} /></span>
      <p>{$t('notifications.empty')}</p>
    </div>
  {:else}
    <ul class="list">
      {#each $notifications as item (item.id)}
        <li class:is-unread={!item.read}>
          <span class="dot" aria-hidden="true"></span>
          <div>
            <p>{notificationText($tx, item)}</p>
            <small>{$formatDateTime(item.createdAt)}</small>
          </div>
          {#if !item.read}
            <button type="button" onclick={() => readNotifications([item.id])}>{$t('notifications.markRead')}</button>
          {/if}
        </li>
      {/each}
    </ul>
    {#if $unreadCount}
      <div class="foot"><Button variant="ghost" onclick={() => readNotifications()}>{$t('notifications.readAll')}</Button></div>
    {/if}
  {/if}
</Panel>

<style>
  .empty {
    display: grid;
    justify-items: center;
    gap: 12px;
    padding: 56px 16px;
    color: var(--ui-muted);
  }

  .empty__icon {
    display: grid;
    place-items: center;
    width: 88px;
    height: 88px;
    border-radius: 50%;
    background: var(--ui-accent-soft);
    color: var(--ui-accent);
  }

  .empty p {
    margin: 0;
    font-weight: 600;
  }

  .list {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .list li {
    display: grid;
    grid-template-columns: 10px 1fr auto;
    align-items: center;
    gap: 14px;
    padding: 12px 16px;
    border-bottom: 1px solid var(--ui-border);
  }

  .list li:last-child {
    border-bottom: 0;
  }

  .list p {
    margin: 0;
  }

  .list small {
    color: var(--ui-muted);
    font-size: 12px;
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: transparent;
  }

  .is-unread .dot {
    background: var(--ui-accent);
  }

  .is-unread p {
    font-weight: 600;
  }

  .list button {
    padding: 0;
    border: 0;
    background: none;
    color: var(--ui-link);
    font: inherit;
    font-size: 13px;
    cursor: pointer;
  }

  .foot {
    display: flex;
    justify-content: flex-end;
    padding: 12px 16px;
    border-top: 1px solid var(--ui-border);
  }
</style>
