<script lang="ts">
  /** Картка категорії: кольорова верхня межа, заголовок, список посилань з іконками */
  import { Icon, type IconName } from '$lib/ui/elements';

  type Tone = 'blue' | 'purple' | 'green' | 'orange' | 'slate';
  type Item = { href: string; label: string; icon?: IconName };

  let { title, items, tone = 'slate' }: { title: string; items: Item[]; tone?: Tone } = $props();
</script>

<section class="ui-link-card" style:--tone="var(--ui-tone-{tone})">
  <h3 class="ui-link-card__title">{title}</h3>
  <ul class="ui-link-card__list">
    {#each items as item (item.href)}
      <li>
        <a href={item.href}>
          {#if item.icon}<Icon name={item.icon} />{/if}
          {item.label}
        </a>
      </li>
    {/each}
  </ul>
</section>

<style>
  .ui-link-card {
    border: 1px solid var(--ui-border);
    border-top: 3px solid var(--tone);
    border-radius: var(--ui-radius);
    background: var(--ui-surface);
  }

  .ui-link-card__title {
    padding: 12px 16px;
    border-bottom: 1px solid var(--ui-border);
    font-size: 14px;
    font-weight: 600;
  }

  .ui-link-card__list {
    display: grid;
    gap: 2px;
    margin: 0;
    padding: 10px 8px 14px;
    list-style: none;
  }

  .ui-link-card__list a {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 7px 8px;
    border-radius: var(--ui-radius);
    color: var(--ui-text);
    font-size: 14px;
    text-decoration: none;
  }

  .ui-link-card__list a:hover {
    background: var(--ui-surface-muted);
    color: var(--ui-link);
  }
</style>
