<script lang="ts">
  /** Клітинка «людина»: аватар, ім'я (посилання) і підпис (роль / email) */
  import { Avatar } from '$lib/ui/elements';

  let {
    name,
    caption,
    seed,
    src = null,
    href,
    size = 28,
  }: {
    name: string;
    caption?: string;
    /** Ідентикон, якщо немає фото (email) */
    seed: string;
    src?: string | null;
    href?: string;
    size?: number;
  } = $props();
</script>

<span class="person">
  <Avatar {seed} {src} {size} />
  <span class="person__text">
    {#if href}<a href={href}>{name}</a>{:else}<span class="person__name">{name}</span>{/if}
    {#if caption}<small>{caption}</small>{/if}
  </span>
</span>

<style lang="scss">
  .person {
    display: inline-flex;
    align-items: center;
    gap: space(2) + 2px;
    min-width: 0;

    :global(.ui-avatar) {
      border-radius: 50%;
    }
  }

  .person__text {
    display: grid;
    min-width: 0;
    line-height: 1.25;
  }

  a,
  .person__name {
    @include truncate;
    font-weight: 500;
  }

  small {
    @include truncate;
    color: var(--ui-muted);
    font-size: var(--ui-fs-xs);
  }
</style>
