<script lang="ts">
  /** Мітка-статус (роль, рівень доступу) */
  import type { Snippet } from 'svelte';

  type Tone = 'blue' | 'purple' | 'green' | 'orange' | 'slate';

  let { tone = 'slate', children }: { tone?: Tone; children: Snippet } = $props();
</script>

<span class="ui-badge" style:--tone="var(--ui-tone-{tone})">{@render children()}</span>

<style>
  .ui-badge {
    display: inline-flex;
    align-items: center;
    height: 22px;
    padding: 0 8px;
    border-radius: 4px;
    background: color-mix(in srgb, var(--tone) 14%, transparent);
    color: var(--tone);
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
  }
</style>
